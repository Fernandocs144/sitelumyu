function createQualificationSchema() {
  return {
    type: 'object',
    properties: {
      primary_service: {
        type: ['string', 'null'],
        enum: ['websites', 'automation', 'ai', 'digital_growth', null],
        description: 'Primary authorized service area requested by visitor.',
      },
      service_variant: {
        type: ['string', 'null'],
        enum: ['landing_page', 'institutional_website', 'custom_website', 'ecommerce', null],
        description: 'Specific variant of website service if primary_service is websites: landing_page, institutional_website, custom_website, or ecommerce.',
      },
      secondary_services: {
        type: 'array',
        items: {
          type: 'string',
          enum: ['websites', 'automation', 'ai', 'digital_growth'],
        },
        description: 'Secondary authorized service areas mentioned by visitor.',
      },
      has_existing_website: {
        type: ['boolean', 'null'],
        description: 'Indicates whether visitor already has an existing website (true), explicitly does not have a website (false), or unknown (null).',
      },
      name: {
        type: ['string', 'null'],
        description: 'Visitor full or first name if explicitly stated by visitor.',
      },
      email: {
        type: ['string', 'null'],
        description: 'Visitor email address if explicitly stated by visitor.',
      },
      company_name: {
        type: ['string', 'null'],
        description: 'Visitor company or organization name if explicitly stated by visitor.',
      },
      company_activity: {
        type: ['string', 'null'],
        description: 'Main business activity or sector of the visitor company if explicitly stated by visitor.',
      },
      target_audience: {
        type: ['string', 'null'],
        description: 'Main customer profile, market, or target audience explicitly stated by visitor.',
      },
      website_url: {
        type: ['string', 'null'],
        description: 'Visitor current website URL if explicitly stated by visitor.',
      },
      need_description: {
        type: ['string', 'null'],
        description: 'Description of specific business needs, problem, or project scope stated by visitor.',
      },
      operational_impact: {
        type: ['string', 'null'],
        description: 'Impact on operations, workflow, or pain point described by visitor.',
      },
      timeline: {
        type: ['string', 'null'],
        description: 'Desired timeframe, deadline, or launch target stated by visitor.',
      },
      decision_involvement: {
        type: ['string', 'null'],
        description: 'Role or decision-making authority stated by visitor.',
      },
      stated_budget_raw: {
        type: ['string', 'null'],
        description: 'Raw budget or investment amount explicitly stated by visitor for their project.',
      },
      meeting_intent_signal: {
        type: ['string', 'null'],
        enum: ['accepted', 'considering', 'declined', 'human_contact_requested', null],
        description: 'Visitor intent signal regarding a meeting proposal or commercial advance.',
      },
      turn_intent: {
        type: ['string', 'null'],
        enum: [
          'qualification_answer',
          'direct_question',
          'correction',
          'scope_change',
          'possible_new_project',
          'booking_response',
          'other',
          null,
        ],
        description: 'Predominant intent of the visitor message in the current turn.',
      },
    },
    required: [
      'primary_service',
      'service_variant',
      'secondary_services',
      'has_existing_website',
      'name',
      'email',
      'company_name',
      'company_activity',
      'target_audience',
      'website_url',
      'need_description',
      'operational_impact',
      'timeline',
      'decision_involvement',
      'stated_budget_raw',
      'meeting_intent_signal',
      'turn_intent',
    ],
    additionalProperties: false,
  };
}

export const commercialAgentResponseSchema = {
  type: 'object',
  properties: {
    reply: {
      type: 'string',
      description: 'The natural conversational response to show to the website visitor. Plain text without Markdown.',
    },
    qualification: createQualificationSchema(),
  },
  required: ['reply', 'qualification'],
  additionalProperties: false,
};

export const commercialAgentExtractionSchema = {
  type: 'object',
  properties: {
    language: {
      type: 'string',
      enum: ['pt', 'en'],
      description: 'Detected active language for the conversation turn (pt or en).',
    },
    qualification: createQualificationSchema(),
  },
  required: ['language', 'qualification'],
  additionalProperties: false,
};

export const commercialAgentReplySchema = {
  type: 'object',
  properties: {
    reply: {
      type: 'string',
      description: 'The natural conversational response to show to the website visitor. Plain text without Markdown.',
    },
  },
  required: ['reply'],
  additionalProperties: false,
};
