from typing import Annotated, Optional, List
from datetime import datetime, timezone
import os
import asyncio
import logging

import resend
from bson import ObjectId
from dotenv import load_dotenv
from fastapi import FastAPI, APIRouter, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, BeforeValidator, EmailStr, Field, ConfigDict
from motor.motor_asyncio import AsyncIOMotorClient

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(ROOT_DIR, ".env"))

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("lumyo")

MONGO_URL = os.environ.get("MONGO_URL")
DB_NAME = os.environ.get("DB_NAME")
RESEND_API_KEY = os.environ.get("RESEND_API_KEY")
SENDER_EMAIL = os.environ.get("SENDER_EMAIL", "onboarding@resend.dev")
LEAD_NOTIFICATION_EMAIL = os.environ.get("LEAD_NOTIFICATION_EMAIL")
CORS_ORIGINS = os.environ.get("CORS_ORIGINS", "*")

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

if RESEND_API_KEY:
    resend.api_key = RESEND_API_KEY

app = FastAPI(title="LUMYO API")
api = APIRouter(prefix="/api")


# ----- Models -----
PyObjectId = Annotated[str, BeforeValidator(str)]


class LeadCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=120)
    email: EmailStr
    service: str = Field(..., max_length=120)
    message: str = Field(..., min_length=1, max_length=5000)
    language: str = Field(default="pt", max_length=5)


class Lead(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    name: str
    email: EmailStr
    service: str
    message: str
    language: str = "pt"
    created_at: str
    notified: bool = False

    @classmethod
    def from_mongo(cls, doc: dict) -> "Lead":
        return cls(**doc)


# ----- Email -----
def _lead_email_html(lead: LeadCreate) -> str:
    return f"""
    <div style="font-family:Arial,Helvetica,sans-serif;background:#0a0616;padding:24px;color:#f3e9ff">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#160a26;border-radius:16px;overflow:hidden;border:1px solid #ff2d7833">
        <tr><td style="padding:24px 28px;background:linear-gradient(90deg,#ff2d78,#a020f0)">
          <h1 style="margin:0;font-size:20px;letter-spacing:4px;color:#fff">LUMYO — NOVO LEAD</h1>
        </td></tr>
        <tr><td style="padding:28px">
          <p style="margin:0 0 16px;font-size:16px;color:#c9b8e6">Recebeu um novo pedido de contacto:</p>
          <table width="100%" cellpadding="8" cellspacing="0" style="font-size:15px;color:#f3e9ff">
            <tr><td style="color:#ff6db0;width:120px"><b>Nome</b></td><td>{lead.name}</td></tr>
            <tr><td style="color:#ff6db0"><b>Email</b></td><td>{lead.email}</td></tr>
            <tr><td style="color:#ff6db0"><b>Serviço</b></td><td>{lead.service}</td></tr>
            <tr><td style="color:#ff6db0;vertical-align:top"><b>Mensagem</b></td><td>{lead.message}</td></tr>
          </table>
        </td></tr>
        <tr><td style="padding:16px 28px;border-top:1px solid #ffffff11;color:#8a7aa8;font-size:12px">
          Enviado automaticamente pelo formulário do site LUMYO.
        </td></tr>
      </table>
    </div>
    """


async def _send_notification(lead: LeadCreate) -> bool:
    if not RESEND_API_KEY or not LEAD_NOTIFICATION_EMAIL:
        logger.warning("Resend not configured — skipping email notification.")
        return False
    params = {
        "from": SENDER_EMAIL,
        "to": [LEAD_NOTIFICATION_EMAIL],
        "reply_to": lead.email,
        "subject": f"Novo lead LUMYO — {lead.service} ({lead.name})",
        "html": _lead_email_html(lead),
    }
    try:
        await asyncio.to_thread(resend.Emails.send, params)
        return True
    except Exception as e:
        logger.error(f"Failed to send lead email: {e}")
        return False


# ----- Routes -----
@api.get("/")
async def root():
    return {"status": "ok", "service": "LUMYO API"}


@api.post("/leads", response_model=Lead, status_code=201)
async def create_lead(payload: LeadCreate):
    notified = await _send_notification(payload)
    doc = payload.model_dump()
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    doc["notified"] = notified
    result = await db.leads.insert_one(doc)
    doc["_id"] = result.inserted_id
    return Lead.from_mongo(doc)


@api.get("/leads", response_model=List[Lead])
async def list_leads():
    docs = await db.leads.find().sort("created_at", -1).to_list(500)
    return [Lead.from_mongo(d) for d in docs]


app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS.split(",") if CORS_ORIGINS != "*" else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
