/* GENERATED FILE — do not edit.
   Source: data/routine-model.json
   Regenerate: node scripts/generate-routine-model.js
   The authored source carries the full provenance record; this file
   carries only what the runtime needs. */
window.KOTIVA_ROUTINE_MODEL = {
 "stepOrder": [
  "makeup-removal",
  "cleanser",
  "toner",
  "serum",
  "spot-treatment",
  "moisturizer",
  "spf"
 ],
 "concerns": {
  "provenance": "client-stated",
  "evidence": "Company Profile p13: 'Our portfolio includes solutions for acne-prone skin, hydration, skin barrier repair, pigmentation, sensitive skin, anti-aging, and daily skin maintenance.' Extended with oil/pores, scars, sun protection and hair loss, each of which has a dedicated product in the client's own range grouping (p14).",
  "options": [
   {
    "id": "acne",
    "label": "Acne & breakouts",
    "zones": [
     "face"
    ]
   },
   {
    "id": "oil",
    "label": "Oiliness & enlarged pores",
    "zones": [
     "face"
    ]
   },
   {
    "id": "pigmentation",
    "label": "Dark spots & uneven tone",
    "zones": [
     "face",
     "body"
    ]
   },
   {
    "id": "hydration",
    "label": "Dryness & dehydration",
    "zones": [
     "face",
     "body"
    ]
   },
   {
    "id": "barrier",
    "label": "Sensitivity & redness",
    "zones": [
     "face",
     "body"
    ]
   },
   {
    "id": "scars",
    "label": "Scars & marks",
    "zones": [
     "face",
     "body"
    ]
   },
   {
    "id": "ageing",
    "label": "Signs of ageing",
    "zones": [
     "face",
     "body"
    ]
   },
   {
    "id": "sun",
    "label": "Sun protection",
    "zones": [
     "face",
     "body"
    ]
   },
   {
    "id": "hairloss",
    "label": "Hair thinning & shedding",
    "zones": [
     "hair"
    ]
   }
  ]
 },
 "skinTypes": {
  "provenance": "client-implied",
  "evidence": "Derived from per-product suitability prose in Products Knowledge and the Company Profile ('for oily, combination and acne-prone skin', 'especially dry and dehydrated skin', 'for sensitive and easily irritated skin'). Sensitivity is deliberately NOT a skin type — it is an independent axis, matching the client's own prose which pairs sensitivity WITH other types ('suitable for all skin types, including sensitive skin').",
  "options": [
   "oily",
   "dry",
   "combination",
   "balanced"
  ]
 },
 "products": {
  "1": {
   "name": "Kotiva Micellar Water",
   "step": "makeup-removal",
   "zone": [
    "face"
   ],
   "slot": "both",
   "frequency": "Can be used twice daily",
   "format": "micellar water",
   "skinTypes": [
    "oily",
    "dry",
    "combination",
    "balanced"
   ],
   "sensitivitySafe": true,
   "concerns": [
    "hydration",
    "ageing"
   ],
   "acids": [],
   "retinoid": false,
   "unprompted": true,
   "cautions": [],
   "slotProv": "client-implied"
  },
  "2": {
   "name": "Kotiva Acne Cleansing Gel",
   "step": "cleanser",
   "zone": [
    "face"
   ],
   "slot": "both",
   "frequency": "Twice daily",
   "format": "gel",
   "skinTypes": [
    "oily",
    "combination"
   ],
   "sensitivitySafe": false,
   "concerns": [
    "acne",
    "oil"
   ],
   "acids": [],
   "retinoid": false,
   "unprompted": true,
   "cautions": [],
   "slotProv": "client-implied"
  },
  "3": {
   "name": "Kotiva Hyaluronic Facial Cleanser",
   "step": "cleanser",
   "zone": [
    "face"
   ],
   "slot": "both",
   "frequency": "Twice daily",
   "format": "cream",
   "skinTypes": [
    "dry",
    "balanced",
    "combination"
   ],
   "sensitivitySafe": true,
   "concerns": [
    "hydration",
    "maintenance"
   ],
   "acids": [],
   "retinoid": false,
   "unprompted": true,
   "cautions": [],
   "slotProv": "client-implied"
  },
  "4": {
   "name": "Kotiva Facial Foam for Sensitive Skin",
   "step": "cleanser",
   "zone": [
    "face"
   ],
   "slot": "both",
   "frequency": null,
   "format": "foam",
   "skinTypes": [
    "oily",
    "dry",
    "combination",
    "balanced"
   ],
   "sensitivitySafe": true,
   "concerns": [
    "barrier"
   ],
   "acids": [],
   "retinoid": false,
   "unprompted": true,
   "cautions": [],
   "slotProv": "dem-inferred"
  },
  "5": {
   "name": "Kotiva Glow Up Water Essence Toner",
   "step": "toner",
   "zone": [
    "face"
   ],
   "slot": "both",
   "frequency": "Twice daily",
   "format": "essence",
   "skinTypes": [
    "dry",
    "balanced",
    "combination",
    "oily"
   ],
   "sensitivitySafe": true,
   "concerns": [
    "hydration"
   ],
   "acids": [],
   "retinoid": false,
   "unprompted": true,
   "cautions": [],
   "slotProv": "client-implied"
  },
  "6": {
   "name": "Kotiva Oil Control Foam",
   "step": "cleanser",
   "zone": [
    "face"
   ],
   "slot": "both",
   "frequency": "Twice daily",
   "format": "foam",
   "skinTypes": [
    "oily",
    "combination"
   ],
   "sensitivitySafe": false,
   "concerns": [
    "oil",
    "acne"
   ],
   "acids": [
    "lactic"
   ],
   "retinoid": false,
   "unprompted": true,
   "cautions": [],
   "slotProv": "client-implied"
  },
  "7": {
   "name": "Kotiva Face & Body Cleansing Foam",
   "step": "cleanser",
   "zone": [
    "face",
    "body"
   ],
   "slot": "both",
   "frequency": null,
   "format": "foam",
   "skinTypes": [
    "dry",
    "balanced"
   ],
   "sensitivitySafe": true,
   "concerns": [
    "barrier",
    "hydration"
   ],
   "acids": [],
   "retinoid": false,
   "unprompted": true,
   "cautions": [],
   "slotProv": "dem-inferred"
  },
  "8": {
   "name": "Kotiva Post Fillers Lip Balm",
   "step": "lip",
   "zone": [
    "lips"
   ],
   "slot": "any",
   "frequency": "As often as needed",
   "format": "balm",
   "skinTypes": [],
   "sensitivitySafe": null,
   "concerns": [],
   "acids": [],
   "retinoid": true,
   "unprompted": false,
   "routineExcluded": true,
   "positioning": "KOTIVA positions this for post-filler and intensive lip recovery.",
   "cautions": [],
   "slotProv": "client-stated"
  },
  "9": {
   "name": "Kotiva Sun Protection SPF 50+",
   "step": "spf",
   "zone": [
    "face",
    "body"
   ],
   "slot": "am",
   "frequency": "30 minutes before sun exposure; reapply every 2 hours",
   "format": "cream",
   "skinTypes": [
    "dry",
    "balanced",
    "combination"
   ],
   "sensitivitySafe": true,
   "concerns": [
    "sun"
   ],
   "acids": [],
   "retinoid": false,
   "unprompted": true,
   "cautions": [
    "Do not stay too long in the sun, even while using a sunscreen product."
   ],
   "slotProv": "client-stated"
  },
  "10": {
   "name": "Kotiva After Sun Cream",
   "step": "body-care",
   "zone": [
    "face",
    "body"
   ],
   "slot": "any",
   "frequency": "Several times a day",
   "format": "cream",
   "skinTypes": [],
   "sensitivitySafe": true,
   "concerns": [
    "barrier",
    "sun"
   ],
   "acids": [],
   "retinoid": false,
   "unprompted": false,
   "cautions": [],
   "slotProv": "client-stated"
  },
  "11": {
   "name": "Kotiva Younger Hand Cream",
   "step": "hand-care",
   "zone": [
    "body"
   ],
   "slot": "any",
   "frequency": "As often as needed",
   "format": "cream",
   "skinTypes": [
    "dry"
   ],
   "sensitivitySafe": null,
   "concerns": [
    "ageing",
    "hydration"
   ],
   "acids": [],
   "retinoid": true,
   "unprompted": true,
   "cautions": [],
   "slotProv": "client-stated"
  },
  "12": {
   "name": "Kotiva Whitening Hand Cream",
   "step": "hand-care",
   "zone": [
    "body"
   ],
   "slot": "any",
   "frequency": "As often as needed",
   "format": "cream",
   "skinTypes": [],
   "sensitivitySafe": null,
   "concerns": [
    "pigmentation"
   ],
   "acids": [],
   "retinoid": false,
   "unprompted": true,
   "cautions": [],
   "slotProv": "client-stated"
  },
  "13": {
   "name": "Kotiva Anti-Perspirant Roll On",
   "step": "deodorant",
   "zone": [
    "body"
   ],
   "slot": "any",
   "frequency": null,
   "format": "roll-on",
   "skinTypes": [],
   "sensitivitySafe": true,
   "concerns": [],
   "acids": [],
   "retinoid": false,
   "unprompted": true,
   "cautions": [],
   "slotProv": "dem-inferred"
  },
  "14": {
   "name": "Kotiva Whitening Anti-Perspirant",
   "step": "deodorant",
   "zone": [
    "body"
   ],
   "slot": "any",
   "frequency": null,
   "format": "roll-on",
   "skinTypes": [],
   "sensitivitySafe": true,
   "concerns": [
    "pigmentation"
   ],
   "acids": [],
   "retinoid": false,
   "unprompted": true,
   "cautions": [],
   "slotProv": "dem-inferred"
  },
  "15": {
   "name": "Kotiva Hydroshield Post-Laser Cream",
   "step": "moisturizer",
   "zone": [
    "face",
    "body"
   ],
   "slot": "both",
   "frequency": "As often as necessary",
   "format": "cream",
   "skinTypes": [
    "dry",
    "balanced"
   ],
   "sensitivitySafe": true,
   "concerns": [
    "barrier",
    "hydration"
   ],
   "acids": [],
   "retinoid": false,
   "unprompted": false,
   "positioning": "KOTIVA positions this as a post-laser and post-procedure recovery cream. It appears here because it is the range's barrier-repair cream — the only one KOTIVA states is suitable for compromised skin.",
   "cautions": [],
   "slotProv": "dem-inferred"
  },
  "16": {
   "name": "Kotiva Triple Action Whitening Day Cream",
   "step": "moisturizer+spf",
   "zone": [
    "face"
   ],
   "slot": "am",
   "frequency": "Daily",
   "format": "cream",
   "skinTypes": [
    "dry",
    "balanced",
    "combination"
   ],
   "sensitivitySafe": null,
   "concerns": [
    "pigmentation",
    "sun"
   ],
   "acids": [],
   "retinoid": false,
   "unprompted": true,
   "cautions": [
    "Apply daily onto face, neck and décolletage or as directed by your dermatologist or healthcare professional."
   ],
   "slotProv": "client-implied"
  },
  "17": {
   "name": "Kotiva Triple Action Whitening Night Cream",
   "step": "moisturizer",
   "zone": [
    "face"
   ],
   "slot": "pm",
   "frequency": "Every evening",
   "format": "cream",
   "skinTypes": [
    "dry",
    "balanced",
    "combination"
   ],
   "sensitivitySafe": false,
   "concerns": [
    "pigmentation",
    "ageing"
   ],
   "acids": [],
   "retinoid": true,
   "unprompted": true,
   "cautions": [
    "Apply every evening onto face, neck and décolletage or as directed by your dermatologist or healthcare professional."
   ],
   "slotProv": "client-stated"
  },
  "18": {
   "name": "Kotiva Triple Action Bikini Area Whitening Cream",
   "step": "intimate-care",
   "zone": [
    "intimate"
   ],
   "slot": "any",
   "frequency": null,
   "format": "cream",
   "skinTypes": [],
   "sensitivitySafe": null,
   "concerns": [
    "pigmentation"
   ],
   "acids": [],
   "retinoid": false,
   "unprompted": false,
   "positioning": "KOTIVA positions this as intimate care, for external use on the bikini area only.",
   "cautions": [
    "Apply on the external intimate area."
   ],
   "slotProv": "dem-inferred"
  },
  "19": {
   "name": "Kotiva Triple Action Whitening Wash Gel for Sensitive Area",
   "step": "intimate-cleanser",
   "zone": [
    "intimate"
   ],
   "slot": "any",
   "frequency": null,
   "format": "gel",
   "skinTypes": [],
   "sensitivitySafe": null,
   "concerns": [
    "pigmentation"
   ],
   "acids": [
    "lactic"
   ],
   "retinoid": false,
   "unprompted": false,
   "positioning": "KOTIVA positions this as a daily intimate-hygiene wash for sensitive areas.",
   "cautions": [],
   "slotProv": "dem-inferred"
  },
  "20": {
   "name": "Kotiva Acne Control",
   "step": "spot-treatment",
   "zone": [
    "face"
   ],
   "slot": "both",
   "frequency": "Several times a day, depending on your needs",
   "format": "gel",
   "skinTypes": [
    "oily",
    "combination"
   ],
   "sensitivitySafe": false,
   "concerns": [
    "acne",
    "oil"
   ],
   "acids": [
    "salicylic",
    "mandelic",
    "azelaic"
   ],
   "retinoid": false,
   "unprompted": true,
   "cautions": [],
   "slotProv": "client-implied"
  },
  "21": {
   "name": "Kotiva Pores Off Serum",
   "step": "serum",
   "zone": [
    "face"
   ],
   "slot": "pm",
   "frequency": "Every night",
   "frequencyReduced": "2-3 times a week",
   "format": "serum",
   "skinTypes": [
    "oily",
    "combination"
   ],
   "sensitivitySafe": false,
   "concerns": [
    "oil",
    "acne",
    "pigmentation"
   ],
   "acids": [
    "salicylic",
    "mandelic",
    "azelaic"
   ],
   "retinoid": false,
   "unprompted": true,
   "cautions": [
    "Avoid contact with eyes.",
    "During first application it may cause slight tingling sensation."
   ],
   "slotProv": "client-stated"
  },
  "22": {
   "name": "Kotiva UV Balance SPF 50+",
   "step": "spf",
   "zone": [
    "face",
    "body"
   ],
   "slot": "am",
   "frequency": "30 minutes before sun exposure; reapply every 2 hours",
   "format": "cream",
   "skinTypes": [
    "oily",
    "combination"
   ],
   "sensitivitySafe": true,
   "concerns": [
    "sun",
    "oil"
   ],
   "acids": [],
   "retinoid": false,
   "unprompted": true,
   "cautions": [
    "Do not stay too long in the sun, even while using a sunscreen product."
   ],
   "slotProv": "client-stated"
  },
  "23": {
   "name": "Kotiva Anti-Hair Loss Ampoules",
   "step": "hair-treatment",
   "zone": [
    "hair"
   ],
   "slot": "either",
   "frequency": "Every other day, for at least 4 weeks",
   "format": "ampoule",
   "skinTypes": [],
   "sensitivitySafe": null,
   "concerns": [
    "hairloss"
   ],
   "acids": [],
   "retinoid": false,
   "unprompted": true,
   "cautions": [
    "Do not rinse off."
   ],
   "slotProv": "client-stated"
  },
  "24": {
   "name": "Kotiva Anti-Hair Loss Shampoo",
   "step": "hair-cleanser",
   "zone": [
    "hair"
   ],
   "slot": "any",
   "frequency": null,
   "format": "shampoo",
   "skinTypes": [],
   "sensitivitySafe": null,
   "concerns": [
    "hairloss"
   ],
   "acids": [],
   "retinoid": false,
   "unprompted": true,
   "cautions": [],
   "slotProv": "dem-inferred"
  },
  "25": {
   "name": "Kotiva Siliscar Gel",
   "step": "spot-treatment",
   "zone": [
    "face",
    "body"
   ],
   "slot": "both",
   "frequency": "2-3 times daily",
   "format": "gel",
   "skinTypes": [],
   "sensitivitySafe": true,
   "concerns": [
    "scars"
   ],
   "acids": [],
   "retinoid": false,
   "unprompted": true,
   "cautions": [],
   "slotProv": "client-implied"
  }
 }
};
