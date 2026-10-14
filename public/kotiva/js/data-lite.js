/* ============================================================
   KOTIVA™ — Product Data (LITE) v3.0
   25 SKUs — listing/catalog fields only (name, image, tags, category,
   skinType, concern, ingredients list, etc.) — no long-form clinical
   text. Loaded on every page that touches product data.
   Full clinical science/description/benefits/howToUse text lives in
   data-full.js, loaded ONLY by product.html (K3, DEC-pending).
   Source of truth: FILE-02_Product-SSoT.md
   ============================================================ */

const KOTIVA_PRODUCTS = [
  {
    "id": 1,
    "kot": "KOT001",
    "slug": "micellar-water",
    "name": "Kotiva Micellar Water",
    "category": "Cleanser",
    "filterTags": [
      "face",
      "cleanser"
    ],
    "skinType": "All Skin Types",
    "concern": "Makeup Removal",
    "volume": "500ml",
    "price": 155.25,
    "currency": "SAR",
    "action": "Makeup Removal",
    "ingredients": [
      "Caviar Extract",
      "Hyaluronic Acid",
      "Marine Collagen"
    ],
    "freeFrom": [],
    "image": "assets/products/kot001-micellar-water.webp",
    "imageStatus": "photo",
    "featured": true,
    "bestSeller": true
  },
  {
    "id": 2,
    "kot": "KOT002",
    "slug": "acne-cleansing-gel",
    "name": "Kotiva Acne Cleansing Gel",
    "category": "Cleanser",
    "filterTags": [
      "face",
      "cleanser",
      "treatments"
    ],
    "skinType": "Oily / Acne-Prone",
    "concern": "Acne & Breakouts",
    "volume": "200ml",
    "price": 166.75,
    "currency": "SAR",
    "action": "Acne & Breakouts",
    "ingredients": [
      "Niacinamide",
      "Zinc PCA",
      "Allantoin",
      "Green Tea Extract"
    ],
    "freeFrom": [],
    "image": "assets/products/kot002-acne-cleansing-gel.webp",
    "imageStatus": "photo",
    "featured": true,
    "bestSeller": true
  },
  {
    "id": 3,
    "kot": "KOT003",
    "slug": "hyaluronic-facial-cleanser",
    "name": "Kotiva Hyaluronic Facial Cleanser",
    "category": "Cleanser",
    "filterTags": [
      "face",
      "cleanser"
    ],
    "skinType": "All Skin Types",
    "concern": "Hydration",
    "volume": "200ml",
    "price": 155.25,
    "currency": "SAR",
    "action": "Hydration",
    "ingredients": [
      "Hyaluronic Acid",
      "Pro-Vitamin B5 (Panthenol)",
      "Oryza Sativa (Rice) Extract"
    ],
    "freeFrom": [],
    "image": "assets/products/kot003-hyaluronic-facial-cleanser.webp",
    "imageStatus": "photo",
    "featured": false,
    "bestSeller": false
  },
  {
    "id": 4,
    "kot": "KOT004",
    "slug": "facial-foam-sensitive",
    "name": "Kotiva Facial Foam for Sensitive Skin",
    "category": "Cleanser",
    "filterTags": [
      "face",
      "cleanser"
    ],
    "skinType": "Sensitive Skin",
    "concern": "Soothing & Calming",
    "volume": "200ml",
    "price": 155.25,
    "currency": "SAR",
    "action": "Soothing & Calming",
    "ingredients": [
      "Niacinamide",
      "Allantoin",
      "Arnica Extract"
    ],
    "freeFrom": [],
    "image": "assets/products/kot004-facial-foam-sensitive.webp",
    "imageStatus": "photo",
    "featured": false,
    "bestSeller": false
  },
  {
    "id": 5,
    "kot": "KOT005",
    "slug": "glow-up-water-essence-toner",
    "name": "Kotiva Glow Up Water Essence Toner",
    "category": "Toner",
    "filterTags": [
      "face"
    ],
    "skinType": "All Skin Types",
    "concern": "Glow & Radiance",
    "volume": "200ml",
    "price": 172.5,
    "currency": "SAR",
    "action": "Glow & Radiance",
    "ingredients": [
      "Hyaluronic Acid",
      "Niacinamide",
      "Panthenol (Pro-Vitamin B5)",
      "Oryza Sativa (Rice) Extract"
    ],
    "freeFrom": [],
    "image": "assets/products/kot005-glow-up-water-essence-toner.webp",
    "imageStatus": "photo",
    "featured": true,
    "bestSeller": true
  },
  {
    "id": 6,
    "kot": "KOT006",
    "slug": "oil-control-foam",
    "name": "Kotiva Oil Control Foam",
    "category": "Cleanser",
    "filterTags": [
      "face",
      "cleanser"
    ],
    "skinType": "Oily Skin",
    "concern": "Oil Control",
    "volume": "200ml",
    "price": 166.75,
    "currency": "SAR",
    "action": "Oil Control",
    "ingredients": [
      "Allantoin",
      "Panthenol (Pro-Vitamin B5)",
      "Aloe Barbadensis Leaf Juice",
      "Salvia Officinalis (Sage) Extract",
      "Cucurbita Pepo (Pumpkin) Seed Oil",
      "Rosmarinus Officinalis (Rosemary) Leaf Oil",
      "Salvia Sclarea (Clary Sage) Oil",
      "Chamomilla Recutita (Chamomile) Flower Oil",
      "Mentha Piperita (Peppermint) Oil",
      "Lactic Acid"
    ],
    "freeFrom": [],
    "image": "assets/products/kot006-oil-control-foam.webp",
    "imageStatus": "photo",
    "featured": false,
    "bestSeller": false
  },
  {
    "id": 7,
    "kot": "KOT007",
    "slug": "face-body-cleansing-foam",
    "name": "Kotiva Face & Body Cleansing Foam",
    "category": "Cleanser",
    "filterTags": [
      "face",
      "body",
      "cleanser"
    ],
    "skinType": "All Skin Types",
    "concern": "Daily Cleansing",
    "volume": "200ml",
    "price": 155.25,
    "currency": "SAR",
    "action": "Daily Cleansing",
    "ingredients": [
      "Cannabis Sativa Seed Oil",
      "Glycyrrhiza (Licorice) Extract"
    ],
    "freeFrom": [],
    "image": "assets/products/kot007-face-body-cleansing-foam.webp",
    "imageStatus": "photo",
    "featured": false,
    "bestSeller": false
  },
  {
    "id": 8,
    "kot": "KOT008",
    "slug": "post-fillers-lip-balm",
    "name": "Kotiva Post Fillers Lip Balm",
    "category": "Lip Care",
    "filterTags": [
      "face"
    ],
    "skinType": "All Skin Types",
    "concern": "Lip Care",
    "volume": "4.9 g",
    "price": 138.0,
    "currency": "SAR",
    "action": "Lip Care",
    "ingredients": [
      "Arnica Extract (Arnica Montana)",
      "Peppermint Oil (Mentha Piperita Oil)",
      "Vitamin E",
      "Witch Hazel Extract (Hamamelis Virginiana)"
    ],
    "freeFrom": [],
    "image": "assets/products/kot008-post-fillers-lip-balm.webp",
    "imageStatus": "photo",
    "featured": false,
    "bestSeller": false
  },
  {
    "id": 9,
    "kot": "KOT009",
    "slug": "sun-protection-spf50",
    "name": "Kotiva Sun Protection SPF 50+",
    "category": "SPF",
    "filterTags": [
      "spf",
      "face"
    ],
    "skinType": "All Skin Types",
    "concern": "Sun Protection",
    "volume": "125ml",
    "price": 184.0,
    "currency": "SAR",
    "action": "Sun Protection",
    "ingredients": [
      "UV Filter System",
      "Hydromanil™"
    ],
    "freeFrom": [],
    "image": "assets/products/kot009-sun-protection-spf50.webp",
    "imageStatus": "photo",
    "featured": true,
    "bestSeller": true
  },
  {
    "id": 10,
    "kot": "KOT010",
    "slug": "after-sun-cream",
    "name": "Kotiva After Sun Cream",
    "category": "Body",
    "filterTags": [
      "body"
    ],
    "skinType": "All Skin Types",
    "concern": "After-Sun Soothing",
    "volume": "100ml",
    "price": 138.0,
    "currency": "SAR",
    "action": "After-Sun Soothing",
    "ingredients": [
      "Panthenol (10%)",
      "Shea Butter (Butyrospermum Parkii Butter)",
      "Arnica Extract"
    ],
    "freeFrom": [],
    "image": "assets/products/kot010-after-sun-cream.webp",
    "imageStatus": "photo",
    "featured": false,
    "bestSeller": false
  },
  {
    "id": 11,
    "kot": "KOT011",
    "slug": "younger-hand-cream",
    "name": "Kotiva Younger Hand Cream",
    "category": "Hand Care",
    "filterTags": [
      "body"
    ],
    "skinType": "All Skin Types",
    "concern": "Anti-Aging",
    "volume": "100ml",
    "price": 143.75,
    "currency": "SAR",
    "action": "Anti-Aging",
    "ingredients": [
      "Hyaluronic Acid",
      "Shea Butter (Butyrospermum Parkii Butter)",
      "Avocado Oil (Persea Gratissima Oil)"
    ],
    "freeFrom": [],
    "image": "assets/products/kot011-younger-hand-cream.webp",
    "imageStatus": "photo",
    "featured": false,
    "bestSeller": false
  },
  {
    "id": 12,
    "kot": "KOT012",
    "slug": "whitening-hand-cream",
    "name": "Kotiva Whitening Hand Cream",
    "category": "Hand Care",
    "filterTags": [
      "body"
    ],
    "skinType": "All Skin Types",
    "concern": "Brightening",
    "volume": "50ml",
    "price": 270.25,
    "currency": "SAR",
    "action": "Brightening",
    "ingredients": [
      "Alpha Arbutin",
      "Glutathione",
      "Shea Butter (Butyrospermum Parkii Butter)",
      "UV Filters"
    ],
    "freeFrom": [],
    "image": "assets/products/kot012-whitening-hand-cream.webp",
    "imageStatus": "photo",
    "featured": false,
    "bestSeller": false
  },
  {
    "id": 13,
    "kot": "KOT013",
    "slug": "anti-perspirant-roll-on",
    "name": "Kotiva Anti-Perspirant Roll On",
    "category": "Body",
    "filterTags": [
      "body"
    ],
    "skinType": "All Skin Types",
    "concern": "Anti-Perspirant",
    "volume": "50ml",
    "price": 92.0,
    "currency": "SAR",
    "action": "Anti-Perspirant",
    "ingredients": [
      "Hyaluronic Acid",
      "Allantoin",
      "Salvia Officinalis (Sage) Extract"
    ],
    "freeFrom": [],
    "image": "assets/products/kot013-anti-perspirant-roll-on.webp",
    "imageStatus": "photo",
    "featured": false,
    "bestSeller": false
  },
  {
    "id": 14,
    "kot": "KOT014",
    "slug": "whitening-anti-perspirant",
    "name": "Kotiva Whitening Anti-Perspirant",
    "category": "Body",
    "filterTags": [
      "body"
    ],
    "skinType": "All Skin Types",
    "concern": "Brightening",
    "volume": "50ml",
    "price": 172.5,
    "currency": "SAR",
    "action": "Brightening",
    "ingredients": [
      "Alpha Arbutin",
      "Tranexamic Acid",
      "Centella Asiatica Extract",
      "Tetrapeptide Complex"
    ],
    "freeFrom": [],
    "image": "assets/products/kot014-whitening-anti-perspirant.webp",
    "imageStatus": "photo",
    "featured": false,
    "bestSeller": false
  },
  {
    "id": 15,
    "kot": "KOT015",
    "slug": "hydroshield-post-laser-cream",
    "name": "Kotiva Hydroshield Post-Laser Cream",
    "category": "Treatment",
    "filterTags": [
      "face",
      "treatments"
    ],
    "skinType": "Post-Procedure",
    "concern": "Barrier Repair",
    "volume": "250ml",
    "price": 195.5,
    "currency": "SAR",
    "action": "Barrier Repair",
    "ingredients": [
      "Ceramide EOP, NP, AP",
      "Panthenol (Pro-Vitamin B5)",
      "Butyrospermum Parkii (Shea Butter)",
      "Plantago Lanceolata Leaf Extract",
      "Centella Asiatica Root Extract",
      "Allantoin",
      "Glycyrrhiza Glabra (Licorice) Root Extract"
    ],
    "freeFrom": [],
    "image": "assets/products/kot015-hydroshield-post-laser-cream.webp",
    "imageStatus": "photo",
    "featured": false,
    "bestSeller": false
  },
  {
    "id": 16,
    "kot": "KOT016",
    "slug": "whitening-day-cream-spf50",
    "name": "Kotiva Triple Action Whitening Day Cream",
    "category": "Treatment",
    "filterTags": [
      "face",
      "treatments",
      "spf"
    ],
    "skinType": "All Skin Types",
    "concern": "Brightening",
    "volume": "50ml",
    "price": 402.5,
    "currency": "SAR",
    "action": "Brightening",
    "ingredients": [
      "Alpha Arbutin",
      "Boerhavia Diffusa (Punarnava) Root Extract",
      "Vitamin E (Tocopherol)",
      "UV Filters"
    ],
    "freeFrom": [],
    "image": "assets/products/kot016-whitening-day-cream-spf50.webp",
    "imageStatus": "photo",
    "featured": true,
    "bestSeller": false
  },
  {
    "id": 17,
    "kot": "KOT017",
    "slug": "whitening-night-cream",
    "name": "Kotiva Triple Action Whitening Night Cream",
    "category": "Treatment",
    "filterTags": [
      "face",
      "treatments"
    ],
    "skinType": "All Skin Types",
    "concern": "Brightening",
    "volume": "50ml",
    "price": 402.5,
    "currency": "SAR",
    "action": "Brightening",
    "ingredients": [
      "Alpha Arbutin",
      "Tranexamic Acid",
      "Potassium Azeloyl Diglycinate",
      "Tetrapeptide-30",
      "Tocopherol (Vitamin E)"
    ],
    "freeFrom": [],
    "image": "assets/products/kot017-whitening-night-cream.webp",
    "imageStatus": "photo",
    "featured": false,
    "bestSeller": false
  },
  {
    "id": 18,
    "kot": "KOT018",
    "slug": "bikini-area-whitening-cream",
    "name": "Kotiva Triple Action Bikini Area Whitening Cream",
    "category": "Treatment",
    "filterTags": [
      "body",
      "treatments"
    ],
    "skinType": "Sensitive Area",
    "concern": "Brightening",
    "volume": "50ml",
    "price": 402.5,
    "currency": "SAR",
    "action": "Brightening",
    "ingredients": [
      "Alpha Arbutin",
      "Glutathione",
      "Licorice (Glycyrrhiza Glabra) Root Extract",
      "Inulin",
      "Alpha-Glucan Oligosaccharide"
    ],
    "freeFrom": [],
    "image": "assets/products/kot018-bikini-area-whitening-cream.webp",
    "imageStatus": "photo",
    "featured": false,
    "bestSeller": false
  },
  {
    "id": 19,
    "kot": "KOT019",
    "slug": "whitening-wash-gel-sensitive",
    "name": "Kotiva Triple Action Whitening Wash Gel for Sensitive Area",
    "category": "Cleanser",
    "filterTags": [
      "body",
      "cleanser"
    ],
    "skinType": "Sensitive Area",
    "concern": "Brightening",
    "volume": "200ml",
    "price": 166.75,
    "currency": "SAR",
    "action": "Brightening",
    "ingredients": [
      "Alpha Arbutin",
      "Lactic Acid",
      "Chamomile Extract"
    ],
    "freeFrom": [],
    "image": "assets/products/kot019-whitening-wash-gel-sensitive.webp",
    "imageStatus": "photo",
    "featured": false,
    "bestSeller": false
  },
  {
    "id": 20,
    "kot": "KOT020",
    "slug": "acne-control",
    "name": "Kotiva Acne Control",
    "category": "Treatment",
    "filterTags": [
      "face",
      "treatments"
    ],
    "skinType": "Oily / Acne-Prone",
    "concern": "Acne & Breakouts",
    "volume": "20ml",
    "price": 172.5,
    "currency": "SAR",
    "action": "Acne & Breakouts",
    "ingredients": [
      "Niacinamide",
      "Zinc PCA",
      "Azelaic Acid",
      "Salicylic Acid (BHA)",
      "Mandelic Acid (AHA)",
      "Salix Alba (Willow Bark) Extract",
      "Eucalyptus Globulus Oil"
    ],
    "freeFrom": [],
    "image": "assets/products/kot020-acne-control.webp",
    "imageStatus": "photo",
    "featured": true,
    "bestSeller": true
  },
  {
    "id": 21,
    "kot": "KOT021",
    "slug": "pores-off-serum",
    "name": "Kotiva Pores Off Serum",
    "category": "Serums",
    "filterTags": [
      "serums",
      "face"
    ],
    "skinType": "Oily / Combination",
    "concern": "Pores & Texture",
    "volume": "50ml",
    "price": 230.0,
    "currency": "SAR",
    "action": "Pores & Texture",
    "ingredients": [
      "Salicylic Acid (BHA)",
      "Mandelic Acid (AHA)",
      "Azelaic Acid",
      "Niacinamide",
      "White Willow Bark Extract"
    ],
    "freeFrom": [],
    "image": "assets/products/kot021-pores-off-serum.webp",
    "imageStatus": "photo",
    "featured": false,
    "bestSeller": false
  },
  {
    "id": 22,
    "kot": "KOT022",
    "slug": "uv-balance-spf50",
    "name": "Kotiva UV Balance SPF 50+",
    "category": "SPF",
    "filterTags": [
      "spf",
      "face"
    ],
    "skinType": "Oily / Acne-Prone",
    "concern": "Sun Protection",
    "volume": "125ml",
    "price": 184.0,
    "currency": "SAR",
    "action": "Sun Protection",
    "ingredients": [
      "UV Filter System",
      "Salvia Officinalis (Sage) Extract",
      "Hamamelis Virginiana (Witch Hazel) Extract"
    ],
    "freeFrom": [],
    "image": "assets/products/kot022-uv-balance-spf50.webp",
    "imageStatus": "photo",
    "featured": true,
    "bestSeller": true
  },
  {
    "id": 23,
    "kot": "KOT023",
    "slug": "anti-hair-loss-ampoules",
    "name": "Kotiva Anti-Hair Loss Ampoules",
    "category": "Hair",
    "filterTags": [
      "hair"
    ],
    "skinType": "All Hair Types",
    "concern": "Hair Loss",
    "volume": "150ml",
    "price": 345.0,
    "currency": "SAR",
    "action": "Hair Loss",
    "ingredients": [
      "Baicapil™ Complex",
      "Rosmarinus Officinalis (Rosemary) Extract",
      "Saw Palmetto Extract",
      "Niacinamide"
    ],
    "freeFrom": [],
    "image": "assets/products/kot023-anti-hair-loss-ampoules.webp",
    "imageStatus": "photo",
    "featured": false,
    "bestSeller": true
  },
  {
    "id": 24,
    "kot": "KOT024",
    "slug": "anti-hair-loss-shampoo",
    "name": "Kotiva Anti-Hair Loss Shampoo",
    "category": "Hair",
    "filterTags": [
      "hair"
    ],
    "skinType": "All Hair Types",
    "concern": "Hair Loss",
    "volume": "250ml",
    "price": 172.5,
    "currency": "SAR",
    "action": "Hair Loss",
    "ingredients": [
      "Baicapil™ Complex",
      "Rosmarinus Officinalis (Rosemary) Extract",
      "Saw Palmetto Extract"
    ],
    "freeFrom": [],
    "image": "assets/products/kot024-anti-hair-loss-shampoo.webp",
    "imageStatus": "photo",
    "featured": false,
    "bestSeller": false
  },
  {
    "id": 25,
    "kot": "KOT025",
    "slug": "siliscar-gel",
    "name": "Kotiva Siliscar Gel",
    "category": "Treatment",
    "filterTags": [
      "face",
      "treatments"
    ],
    "skinType": "Scar-Prone",
    "concern": "Scars & Barrier",
    "volume": "20ml",
    "price": 345.0,
    "currency": "SAR",
    "action": "Scars & Barrier",
    "ingredients": [
      "Silicone Gel Technology"
    ],
    "freeFrom": [],
    "image": "assets/products/kot025-siliscar-gel.webp",
    "imageStatus": "photo",
    "featured": false,
    "bestSeller": false
  }
];

const HERO_INGREDIENTS = [
  /* Product ID arrays corrected 2026-07-16 (DEC-245): every array below is derived from the
     products' own `ingredients` lists in this file (mechanically verified), replacing stale
     hand-written IDs that asserted false ingredient-product associations (§9e class). Retinol
     and Zinc Oxide match ZERO products — their arrays are empty and science.html hides
     zero-product cards; whether to replace those two hero actives is a flagged content
     decision (operator/client), not silently made here.

     RETINOL RESOLVED 2026-08-18 (K35). Not a content preference in the end, a factual error with
     a traceable origin: "Retinol" entered from a PRE-DEM 2026-05 agency draft describing a
     product ("Skin Renew") that is not in the client's 25-SKU range, and survived the v2.0
     catalogue rebuild (64a0d4c) as an orphaned marketing entry. THREE independent client-derived
     sources agree the compound is RETINYL PALMITATE, in exactly three products (8 lip balm,
     11 hand cream, 17 night cream): the client's own Company Profile (retinyl x3, retinol x0),
     data-full.js (retinyl x6, retinol x0), and ingredients.html's generated glossary (retin* x0).
     The card now carries the CLIENT'S OWN wording — "supports skin renewal and improves texture
     and fine lines" — deliberately NOT the previous "gold standard / clinically proven /
     accelerates cell turnover", which is a stronger claim than any client document makes and
     would have been a NEW assertion rather than a correction.
     Zinc Oxide is NOT the same case and is left alone: it appears in 2 products' ingredient
     lists in this file. */
  {
    "name": "Niacinamide",
    "benefit": "Pore Refinement & Even Tone",
    "description": "A validated form of Vitamin B3 that minimises pore appearance, controls sebum production, and visibly evens skin tone. Found in our Glow Up Water Essence and Pores Off Serum.",
    "products": [
      2,
      4,
      5,
      20,
      21,
      23
    ]
  },
  {
    "name": "Hyaluronic Acid",
    "benefit": "Deep Molecular Hydration",
    "description": "Holds up to 1000x its weight in water. Our multi-weight Hyaluronic Acid complex hydrates at every level of the skin — surface, mid, and deep dermal layers.",
    "products": [
      1,
      3,
      5,
      11,
      13
    ]
  },
  {
    "name": "Retinyl Palmitate",
    "benefit": "Supports Skin Renewal",
    "description": "A vitamin A derivative that supports skin renewal and improves the appearance of texture and fine lines, working with the skin’s overnight regeneration cycle.",
    "products": [
      8,
      11,
      17
    ]
  },
  {
    "name": "Tranexamic Acid",
    "benefit": "Advanced Brightening",
    "description": "A clinically studied brightening active that interrupts melanin transfer at the source. More targeted than Vitamin C with a gentler tolerance profile.",
    "products": [
      14,
      17
    ]
  },
  {
    "name": "Salicylic Acid",
    "benefit": "Deep Pore Cleansing",
    "description": "A beta-hydroxy acid that penetrates inside the pore lining to dissolve excess sebum and cellular debris — the clinical solution for consistently clear skin.",
    "products": [
      20,
      21
    ]
  },
  {
    "name": "Zinc Oxide",
    "benefit": "Mineral Sun Protection",
    "description": "A physical UV filter that reflects broad-spectrum UVA/UVB radiation without penetrating the skin. Non-comedogenic and suitable for all skin types including acne-prone.",
    "products": []
  }
];

const JOURNAL_ARTICLES = [
  {
    "id": 1,
    "category": "Ingredients",
    "title": "Why Niacinamide Belongs in Your Morning Routine",
    "date": "May 28, 2026",
    "image": "assets/journal/journal-01-v2.webp",
    "read": "4 min read",
    "excerpt": "We break down the science behind one of skincare's most validated ingredients — and show you exactly how to layer it."
  },
  {
    "id": 2,
    "category": "Education",
    "title": "The Doctor's Guide to SPF",
    "date": "May 22, 2026",
    "image": "assets/journal/journal-02-v2.webp",
    "read": "5 min read",
    "excerpt": "Everything you thought you knew about sun protection — validated, clarified, and made practical for daily MENA life."
  },
  {
    "id": 3,
    "category": "Routines",
    "title": "How to Build Your First Skincare Ritual",
    "date": "May 15, 2026",
    "image": "assets/journal/journal-03-v2.webp",
    "read": "6 min read",
    "excerpt": "Five steps. Four weeks. One consistent practice. The Kotiva method for building a routine that becomes a ritual."
  },
  {
    "id": 4,
    "category": "Ingredients",
    "title": "Hyaluronic Acid: Myth vs. Science",
    "date": "May 8, 2026",
    "image": "assets/journal/journal-04-v2.webp",
    "read": "3 min read",
    "excerpt": "Does it actually go deep into the skin? Is it safe for oily skin? We answer the questions our customers ask most."
  },
  {
    "id": 5,
    "category": "Brand",
    "title": "The Kotiva Standard: What Doctor-Approved Actually Means",
    "date": "April 30, 2026",
    "image": "assets/journal/journal-05-v2.webp",
    "read": "4 min read",
    "excerpt": "Not all doctor endorsements are created equal. Here is what the Kotiva standard of clinical validation requires."
  },
  {
    "id": 6,
    "category": "Dermatology",
    "title": "Vitamin A: A Beginner's Guide to Starting Right",
    "date": "April 22, 2026",
    "image": "assets/journal/journal-06-v2.webp",
    "read": "5 min read",
    "excerpt": "Kotiva formulates with retinyl palmitate, a gentler vitamin A derivative. Here is how to introduce it without irritation."
  }
];

const ROUTINE_MAP = {
  "normal": {
    "morning": [
      3,
      5,
      9
    ],
    "evening": [
      3,
      5,
      17
    ]
  },
  "dry": {
    "morning": [
      3,
      5,
      9
    ],
    "evening": [
      3,
      15,
      17
    ]
  },
  "oily": {
    "morning": [
      6,
      21,
      22
    ],
    "evening": [
      2,
      20,
      21
    ]
  },
  "combination": {
    "morning": [
      6,
      5,
      22
    ],
    "evening": [
      2,
      5,
      21
    ]
  },
  "sensitive": {
    "morning": [
      4,
      5,
      9
    ],
    "evening": [
      4,
      15,
      17
    ]
  }
};

/* Helper: get product by ID */
function getProductById(id) {
  return KOTIVA_PRODUCTS.find(p => p.id === id) || null;
}

/* Helper: get featured products */
function getFeaturedProducts() {
  return KOTIVA_PRODUCTS.filter(p => p.featured);
}

/* Helper: get best sellers */
function getBestSellers() {
  return KOTIVA_PRODUCTS.filter(p => p.bestSeller);
}

/* ── KOTIVA namespace shim ── */
window.KOTIVA = {
  products: KOTIVA_PRODUCTS,
  ingredients: HERO_INGREDIENTS,
  articles: JOURNAL_ARTICLES,
  journal: JOURNAL_ARTICLES,
  routines: ROUTINE_MAP,
  productImage: function(p) { return p ? p.image : ''; },
  getById: getProductById,
  getFeatured: getFeaturedProducts,
  getBestSellers: getBestSellers
};
