import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const DESTINATION_EMAIL = 'fernando.jcsiilva@gmail.com';

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export default {
  async fetch(request) {
    if (request.method !== 'POST') {
      return Response.json(
        {
          success: false,
          error: 'Method not allowed',
        },
        {
          status: 405,
          headers: {
            Allow: 'POST',
          },
        }
      );
    }

    try {
      const body = await request.json();

      const {
        name,
        email,
        service,
        message,

        // Honeypot anti-spam.
        website,
      } = body ?? {};

      /*
       * Bots costumam preencher campos escondidos.
       * Um utilizador real nunca deve preencher "website".
       */
      if (website) {
        return Response.json({
          success: true,
        });
      }

      const cleanName = String(name ?? '').trim();
      const cleanEmail = String(email ?? '').trim();
      const cleanService = String(service ?? '').trim();
      const cleanMessage = String(message ?? '').trim();

      if (
        !cleanName ||
        !cleanEmail ||
        !cleanService ||
        !cleanMessage
      ) {
        return Response.json(
          {
            success: false,
            error: 'Missing required fields',
          },
          {
            status: 400,
          }
        );
      }

      const emailPattern =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailPattern.test(cleanEmail)) {
        return Response.json(
          {
            success: false,
            error: 'Invalid email',
          },
          {
            status: 400,
          }
        );
      }

      /*
       * Limites simples para evitar payloads absurdos.
       */
      if (
        cleanName.length > 120 ||
        cleanEmail.length > 200 ||
        cleanService.length > 120 ||
        cleanMessage.length > 5000
      ) {
        return Response.json(
          {
            success: false,
            error: 'Invalid field length',
          },
          {
            status: 400,
          }
        );
      }

      const safeName = escapeHtml(cleanName);
      const safeEmail = escapeHtml(cleanEmail);
      const safeService = escapeHtml(cleanService);
      const safeMessage = escapeHtml(cleanMessage)
        .replaceAll('\n', '<br />');

      const { data, error } = await resend.emails.send({
        /*
         * Para TESTE, usando a conta Resend associada
         * ao Gmail de destino.
         *
         * Quando o domínio Lumyo estiver novamente activo,
         * trocamos isto por algo como:
         *
         * Lumyo <contacto@lumyo.pt>
         */
        from: 'Lumyo Website <onboarding@resend.dev>',

        to: [DESTINATION_EMAIL],

        /*
         * Ao responderes ao email recebido,
         * a resposta vai directamente para o visitante.
         */
        replyTo: cleanEmail,

        subject: `Novo pedido Lumyo — ${cleanService}`,

        html: `
          <!doctype html>
          <html lang="pt">
            <head>
              <meta charset="utf-8" />
            </head>

            <body
              style="
                margin:0;
                padding:0;
                background:#080414;
                color:#ffffff;
                font-family:Arial, Helvetica, sans-serif;
              "
            >
              <div
                style="
                  max-width:680px;
                  margin:0 auto;
                  padding:40px 24px;
                "
              >
                <div
                  style="
                    color:#ff2b7d;
                    font-size:12px;
                    letter-spacing:4px;
                    margin-bottom:16px;
                  "
                >
                  LUMYO
                </div>

                <h1
                  style="
                    margin:0 0 32px;
                    font-size:28px;
                    line-height:1.2;
                    color:#ffffff;
                  "
                >
                  Novo pedido através do website
                </h1>

                <table
                  width="100%"
                  cellpadding="0"
                  cellspacing="0"
                  style="
                    border-collapse:collapse;
                    background:#12091f;
                    border:1px solid #30243d;
                    border-radius:16px;
                  "
                >
                  <tr>
                    <td
                      style="
                        padding:18px 22px;
                        border-bottom:1px solid #30243d;
                        color:#9b90a7;
                        width:130px;
                      "
                    >
                      Nome
                    </td>

                    <td
                      style="
                        padding:18px 22px;
                        border-bottom:1px solid #30243d;
                        color:#ffffff;
                      "
                    >
                      ${safeName}
                    </td>
                  </tr>

                  <tr>
                    <td
                      style="
                        padding:18px 22px;
                        border-bottom:1px solid #30243d;
                        color:#9b90a7;
                      "
                    >
                      Email
                    </td>

                    <td
                      style="
                        padding:18px 22px;
                        border-bottom:1px solid #30243d;
                        color:#ffffff;
                      "
                    >
                      ${safeEmail}
                    </td>
                  </tr>

                  <tr>
                    <td
                      style="
                        padding:18px 22px;
                        border-bottom:1px solid #30243d;
                        color:#9b90a7;
                      "
                    >
                      Serviço
                    </td>

                    <td
                      style="
                        padding:18px 22px;
                        border-bottom:1px solid #30243d;
                        color:#ffffff;
                      "
                    >
                      ${safeService}
                    </td>
                  </tr>

                  <tr>
                    <td
                      valign="top"
                      style="
                        padding:18px 22px;
                        color:#9b90a7;
                      "
                    >
                      Mensagem
                    </td>

                    <td
                      style="
                        padding:18px 22px;
                        color:#ffffff;
                        line-height:1.6;
                      "
                    >
                      ${safeMessage}
                    </td>
                  </tr>
                </table>
              </div>
            </body>
          </html>
        `,
      });

      if (error) {
        console.error('Resend error:', error);

        return Response.json(
          {
            success: false,
            error: 'Email delivery failed',
          },
          {
            status: 500,
          }
        );
      }

      return Response.json({
        success: true,
        id: data?.id ?? null,
      });
    } catch (error) {
      console.error('Contact API error:', error);

      return Response.json(
        {
          success: false,
          error: 'Internal server error',
        },
        {
          status: 500,
        }
      );
    }
  },
};