# TechSergy Machine Readability, Search Visibility and Analytics Audit

**Audit date:** 14 July 2026  
**Scope:** The uploaded React/Vite repository, its generated production bundle, the currently public `techsergy.com` surface, and current first-party guidance from Google, Bing, OpenAI, Anthropic, Perplexity, Schema.org, Cloudflare and Google Analytics.  
**Primary objective:** Determine what search engines, social crawlers, AI search systems, training crawlers, browser agents and analytics systems understand about TechSergy, then define the work required to improve discovery, rankings, citations and lead measurement.

---

## 1. Executive conclusion

TechSergy has a commercially strong niche: reducing production AI inference cost through model routing, fine-tuning, distillation and self-hosted deployment. The repository communicates that proposition reasonably well to a human after the React application has rendered.

The machine-facing implementation, however, currently creates several competing identities:

1. **The public domain is still an unrelated WordPress publication.** At the time of this audit, `techsergy.com` presents TechSergy as an AI, SEO, digital-marketing and WordPress content site, includes a Philippines address and email, and exposes 2023 blog posts. This is a fundamentally different entity from the UAE-associated AI inference consultancy in the repository.
2. **The raw HTML of the new React application says “AI inference cost reduction,” but contains no page body content.** A crawler initially receives an empty `<div id="root"></div>` and must execute JavaScript to see the page.
3. **The new site’s structured data describes a broad IT consultancy.** It advertises application development, IT strategy and staff augmentation, contradicting the visible specialist positioning.
4. **Every deep route begins with homepage metadata.** The initial HTML contains a root canonical URL, root Open Graph URL, homepage title and homepage social card. React changes only a subset of these tags after JavaScript runs.
5. **The site has only five indexable URLs.** Services and case studies are concentrated into broad pages instead of having durable, query-specific landing pages.
6. **The current wildcard robots policy permits both AI-search crawlers and model-training crawlers.** That may be intentional, but it is not an explicit policy decision.
7. **Analytics records a basic GA4 initialization, but the code does not explicitly measure SPA route changes, lead generation, CTA behavior, case-study engagement or downstream lead quality.**
8. **Five supposedly hidden projects are still shipped in the public JavaScript bundle.** A generic scraper or AI extraction tool can recover them.

### Overall verdict

The site is not being held back by the absence of a special “AI SEO” file. Its main constraints are:

- entity inconsistency;
- client-side-only rendering;
- conflicting structured data;
- weak URL-level information architecture;
- insufficient evidence around strong numerical claims;
- incomplete analytics and conversion instrumentation;
- performance and accessibility friction.

The highest-value intervention is to publish a pre-rendered or statically generated version in which every public URL returns complete HTML, correct page-specific metadata, consistent organization data, unique content and a meaningful HTTP status. That should be paired with an intentional domain migration, dedicated service and case-study URLs, and a complete measurement plan.

---

## 2. Audit status by area

| Area | Status | Business impact | Primary issue |
|---|---|---:|---|
| Live-domain identity | Critical | Very high | Public domain represents an unrelated legacy publication |
| Initial HTML / rendering | Critical | Very high | Empty app shell; important content requires JavaScript |
| Canonicals and route metadata | Critical | Very high | Deep routes initially declare the homepage as canonical |
| Structured data | Critical | High | Deprecated type and stale broad-IT positioning |
| Information architecture | High risk | Very high | Five broad URLs; no service or case-study landing pages |
| Content evidence and trust | High risk | High | Strong quantified claims lack visible methodology |
| Analytics | High risk | Very high | No explicit SPA route or lead-funnel instrumentation |
| AI crawler policy | Needs decision | Medium | Search and training crawlers are all permitted by wildcard |
| Sitemap and indexing controls | Needs improvement | Medium | Only five URLs; no `lastmod`; ignored priority fields |
| Performance | Needs improvement | High | Large single JS bundle, large imagery, global third-party scripts |
| Accessibility / agent semantics | Needs improvement | Medium | Some carousel and disclosure controls lack semantic state |
| Social/link preview metadata | Needs improvement | Medium | Homepage card likely used for every deep URL |
| Private-content separation | Critical | High | Hidden project records remain in the client bundle |

---

## 3. What different machines currently perceive

### 3.1 A crawler visiting the public domain today

The public website currently presents the following identity:

- a technology and digital-marketing publication;
- categories for artificial intelligence, ChatGPT, SEO, affiliate marketing, content marketing and WordPress;
- a North Cotabato, Philippines address;
- a `blog@techsergy.com` contact address;
- historical posts from 2023;
- an “About Us” statement focused on digital-landscape resources.

**Likely machine impression:** “TechSergy is an informational blog or media property about digital marketing and AI tools.”

This is the single biggest issue because search engines and AI systems evaluate the accessible public site, not the unpublished repository. If the React project is intended to become the production site, the launch is also an entity and content migration, not merely a redesign.

### 3.2 A non-JavaScript crawler receiving the new build

The raw HTML contains:

```html
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.jsx"></script>
</body>
```

It receives useful head tags, but no visible page heading, service copy, case-study evidence, founder biography, navigation text or contact content.

**Likely machine impression:** “This is an AI inference-cost website, but the document itself has almost no extractable body content.”

This category can include simple social parsers, lightweight scrapers, some archival tools, some security scanners, text-only systems and AI tools that do not execute a full browser runtime.

### 3.3 Googlebot after rendering JavaScript

Google can render JavaScript and should eventually see the React content. It will encounter:

- a clear specialist proposition;
- strong result claims;
- a five-page site;
- broad service and portfolio pages;
- internal navigation links;
- page-specific title and description updates through React Helmet.

However, Google’s first HTML response contains the homepage canonical on every SPA fallback URL. Google explicitly advises against changing a JavaScript canonical to a value different from the canonical in the original HTML. The app-shell architecture also places every page into a rendering queue, while pre-rendered pages can be parsed immediately.

**Likely machine impression after rendering:** “A small, founder-led AI cost-optimization consultancy with impressive results, but limited topic depth, conflicting organization metadata and insufficient evidence for several claims.”

### 3.4 Bing and other conventional search engines

Bing can process modern sites, but the same principles apply: complete HTML, unique route metadata, clean canonicals, indexable internal links and strong content improve reliability. A five-URL SPA provides few independent retrieval units for a search engine to rank.

**Likely machine impression:** Similar to Google, but potentially more dependent on clearly extractable HTML and rapid URL discovery through sitemap submission and IndexNow.

### 3.5 Social and messaging link-preview crawlers

The static HTML contains only homepage Open Graph and Twitter metadata:

- `og:url` is always the root URL;
- `og:title` and `og:description` describe the homepage;
- `og:image` is a logo image rather than a purpose-built 1200×630 social card;
- there are no page-specific image dimensions or alternative-text tags.

React route components do not define route-level Open Graph or Twitter tags.

**Likely machine impression:** Links to `/services`, `/portfolio`, `/about` and `/contact` may all unfurl as the same homepage card. Case studies have no independent share card because they have no independent URLs.

### 3.6 AI search crawlers

The repository’s wildcard robots file permits OpenAI’s OAI-SearchBot, Anthropic’s Claude-SearchBot, PerplexityBot and other search crawlers. That is favorable for potential inclusion, assuming the CDN/WAF also allows verified crawler IPs.

What they can retrieve, however, is constrained by:

- the app shell;
- few URLs;
- no dedicated source pages for key claims;
- limited methodology and attribution;
- contradictory organization data;
- hidden data embedded in the bundle;
- no stable URLs for individual case-study facts.

**Likely machine impression:** “TechSergy claims substantial AI cost savings and offers specialist services, but there are few citable pages and limited supporting methodology.”

### 3.7 Model-training crawlers

The wildcard allow rule also permits GPTBot, ClaudeBot and Google-Extended unless a more specific policy is added. This is separate from search visibility. A company can allow AI-search crawling while declining model-training crawling.

**Likely machine effect:** Public copy and all content contained in the downloadable client bundle may be eligible for collection, subject to each provider’s policies. Because hidden project records are imported into the bundle, a crawler or dataset collector can retrieve them even though the UI filters them out.

### 3.8 Browser agents and accessibility technology

AI browser agents increasingly use the same semantic signals as assistive technology: headings, links, button names, labels, roles and state attributes. Most of the site has understandable page structure, but several carousel and disclosure controls are weakly labelled.

**Likely agent impression:** Main navigation and forms are understandable, but carousel navigation dots and some expand/collapse controls are harder to identify and operate reliably.

### 3.9 Analytics systems

The site initializes GA4 with:

```js
gtag('config', 'G-CQBCN8B9JT');
```

No additional analytics calls appear in the repository.

**Likely analytics impression:** The initial session and page load may be recorded. Whether subsequent React Router navigations produce correct page views depends on GA4 data-stream configuration that is not represented in the repository. No code explicitly identifies a successful audit submission as a lead, and no funnel connects landing page, CTA, form start, form success, qualification and closed revenue.

---

## 4. Detailed metadata audit

### 4.1 Current global metadata

The static `index.html` contains a useful starting set:

- HTML language is English;
- UTF-8 and responsive viewport are present;
- a homepage title and description exist;
- a canonical URL is declared;
- Open Graph and Twitter tags exist;
- robots is set to `index, follow`;
- JSON-LD is present;
- Google site verification is represented by a public verification file;
- GA4 is initialized.

These are positives, but several tags are inaccurate, redundant or globally applied when they should be page-specific.

### 4.2 Current title and description

Current homepage title:

```text
TechSergy | AI Inference Cost Reduction
```

Current homepage description:

```text
We cut production AI inference costs by 60–85%  through fine-tuning, distillation, and self-hosted inference for companies overpaying OpenAI and Anthropic.
```

Issues:

- There is a visible double space where punctuation appears to have been removed.
- The wording leads with a strong numerical claim but gives no scope or evidence in the snippet.
- “Companies overpaying OpenAI and Anthropic” is direct and commercially clear, but it narrows relevance and may read as adversarial rather than diagnostic.
- The description is used in the global HTML and social metadata, regardless of route.

Suggested homepage title:

```text
AI Inference Cost Optimization | TechSergy
```

Suggested homepage description:

```text
Reduce production LLM inference spend with model routing, distillation, fine-tuning and self-hosted deployment. Review measured case studies or request an AI cost audit.
```

This version describes the methods, offers proof and supports an action without relying entirely on an unsupported percentage claim.

### 4.3 Redundant and low-value tags

The following can be removed or reconsidered:

- `<meta name="title">`: the actual `<title>` element is the relevant title signal.
- `<meta name="keywords">`: Google does not use the keywords meta tag for web ranking.
- `<meta name="language" content="English">`: the `lang="en"` attribute is the standard machine-readable language signal.
- `article:author` and `article:published_time` on the homepage: the page declares `og:type="website"`, not an article.
- `geo.region="AE"`: this is a weak and potentially confusing signal without a verified, consistently published address and company identity.
- `priceRange="$$$$"` in JSON-LD: only retain it if the business intentionally wants to publish this and it accurately describes pricing.

### 4.4 Canonical problem

`index.html` contains:

```html
<link rel="canonical" href="https://techsergy.com/">
```

The route components later inject canonicals such as `/about` and `/services` after JavaScript runs. If the hosting layer sends the same `index.html` for each route—as is standard for a React SPA fallback—then the initial response for every page says the homepage is canonical.

This can create:

- duplicate or conflicting canonical signals;
- delayed recognition of deep URLs;
- inconsistent treatment between crawlers that render JavaScript and those that do not;
- social previews that point to the root URL;
- avoidable indexing uncertainty.

**Required outcome:** The initial HTML returned for each URL must contain its own canonical and no conflicting root canonical.

### 4.5 Route metadata is incomplete

The five React pages define title, description and canonical through Helmet. They do not define:

- route-specific Open Graph title, description, URL and image;
- route-specific Twitter tags;
- route-specific robots directives;
- route-specific JSON-LD;
- breadcrumbs;
- article/report metadata for case studies;
- social-image dimensions and alt text.

Several descriptions are also long or contain punctuation defects. Metadata should be generated from a single route/content manifest to avoid divergence between page code, sitemap, social metadata and structured data.

### 4.6 Social-image quality

The current Open Graph image is a large logo asset with an unusual wide aspect ratio. A better implementation would provide a dedicated 1200×630 image for each important URL with:

- the page topic;
- the TechSergy brand;
- one restrained proof point;
- sufficient contrast;
- `og:image:width`, `og:image:height` and `og:image:alt`;
- matching Twitter image metadata.

Case-study cards should have individual share images rather than all using a corporate logo.

---

## 5. Structured-data audit

### 5.1 Current structured data sends the wrong commercial message

The global JSON-LD declares:

```json
{
  "@type": "ProfessionalService",
  "description": "Premier IT consultancy delivering innovative solutions in AI/ML, Cloud, Web Development, and more.",
  "knowsAbout": [
    "Artificial Intelligence",
    "Machine Learning",
    "Application Development",
    "IT Consulting",
    "Staff Augmentation"
  ]
}
```

Its offer catalog includes application development, IT strategy and staff augmentation.

That conflicts with the current visible proposition that AI inference cost reduction is the company’s specialist focus. A machine cannot confidently decide whether TechSergy is:

- a broad software agency;
- a staffing company;
- a cloud and application-development consultancy;
- or a specialist AI inference optimization firm.

### 5.2 The current type is deprecated

Schema.org marks `ProfessionalService` as deprecated because of confusion with the `Service` type. It is also a subtype of `LocalBusiness`, which may not accurately describe a global, remote-first specialist consultancy without a public customer-facing office.

### 5.3 Recommended entity graph

Use a stable JSON-LD graph rather than a single overloaded object:

1. `Organization` for the business represented by the site.
2. `WebSite` for `techsergy.com` and the preferred site name.
3. `WebPage` for each page.
4. `Person` for the founder, where biography and credentials are visible.
5. `Service` on dedicated service pages.
6. `Article` or `Report` for case-study pages, depending on presentation.
7. `BreadcrumbList` for pages below the root.

Example skeleton:

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://techsergy.com/#organization",
      "name": "TechSergy",
      "legalName": "Exergy FZC",
      "url": "https://techsergy.com/",
      "logo": {
        "@type": "ImageObject",
        "url": "https://techsergy.com/assets/techsergy-logo.png",
        "width": 512,
        "height": 512
      },
      "description": "AI inference cost optimization consultancy focused on model routing, fine-tuning, distillation and self-hosted deployment.",
      "founder": { "@id": "https://techsergy.com/about/naresh-joshi/#person" },
      "sameAs": [
        "https://www.linkedin.com/company/techsergy"
      ]
    },
    {
      "@type": "WebSite",
      "@id": "https://techsergy.com/#website",
      "url": "https://techsergy.com/",
      "name": "TechSergy",
      "publisher": { "@id": "https://techsergy.com/#organization" }
    },
    {
      "@type": "WebPage",
      "@id": "https://techsergy.com/#webpage",
      "url": "https://techsergy.com/",
      "name": "AI Inference Cost Optimization | TechSergy",
      "isPartOf": { "@id": "https://techsergy.com/#website" },
      "about": { "@id": "https://techsergy.com/#organization" }
    }
  ]
}
```

Only publish `legalName`, registration data, address, telephone, service area, credentials and profile links after verifying that they are accurate and visible to users. Structured data must not make claims that the page does not support.

### 5.4 Case-study structured data

Each case study should have a canonical URL and its own machine-readable context:

- headline;
- description;
- date published and modified;
- author and reviewer;
- client naming/anonymization status;
- industry;
- measured outcomes;
- methodology section;
- citations to pricing, models or benchmark data where applicable;
- image;
- breadcrumbs;
- relationship to the organization.

Do not add fake review or rating markup. Numeric business outcomes should be presented as editorial case-study facts, not as aggregate ratings.

### 5.5 FAQ markup

FAQ content can be marked up when the questions and answers are visible and match the JSON-LD. It may improve semantic extraction, but Google now limits FAQ rich results mainly to authoritative government and health sites. Treat FAQ schema as a consistency and machine-understanding aid, not as a guaranteed visual-result tactic.

### 5.6 Validation process

For every template:

1. Validate syntax with Schema.org’s validator.
2. Validate Google-supported features with the Rich Results Test.
3. Use Search Console URL Inspection on the deployed URL.
4. Compare rendered JSON-LD with visible page text.
5. Monitor enhancement and merchant/local-business warnings only where those feature types are genuinely applicable.

---

## 6. Rendering, indexing and HTTP behavior

### 6.1 App-shell architecture

The source and generated bundle return an empty root element. Google can render it, but Google’s own documentation notes that app-shell pages require a separate rendering stage and that server-side rendering or pre-rendering is beneficial because it is faster and not every bot can execute JavaScript.

For a five-page marketing site, client-only rendering is an unnecessary SEO dependency.

### 6.2 Recommended rendering model

Use one of the following, in descending order of fit:

1. **Static-site generation or route pre-rendering:** ideal for the current mostly static site.
2. **A framework with static/server rendering:** for example, a React framework that returns route HTML and hydrates client interactions.
3. **A Vite pre-render plugin or custom build step:** acceptable if migration cost must be minimized.

Expected output:

```text
dist/
├── index.html
├── about/index.html
├── services/index.html
├── portfolio/index.html
├── contact/index.html
├── case-studies/.../index.html
└── services/.../index.html
```

Every file should contain:

- visible primary content;
- page-specific title and description;
- page-specific canonical;
- route-specific social metadata;
- route-specific structured data;
- crawlable links;
- no dependency on JavaScript for the main proposition.

JavaScript should enhance interaction, not be required to reveal the page’s identity.

### 6.3 Real 404 behavior

The router has no catch-all route. Depending on hosting fallback behavior, arbitrary paths may receive the homepage shell with HTTP 200 and no route content. This creates soft-404 risk.

Required implementation:

- a branded not-found page;
- a true HTTP 404 response at the edge/server;
- `noindex` on any client-only fallback error page;
- no canonical to the homepage for unknown URLs.

### 6.4 Link discoverability

Navigation should use real `<a href>` links, which React Router normally provides. Important content should never require a crawler to click a button to load or fetch it. Current case-study details appear to remain in the rendered DOM because they are collapsed rather than fetched, but each case study still needs a standalone URL for ranking, citation and sharing.

### 6.5 Hidden content in the bundle

`src/data/projects/index.js` imports all eight project JSON records before filtering by visibility. Therefore five hidden records are compiled into the JavaScript bundle.

This is not an SEO optimization issue; it is a content-governance and confidentiality issue. Robots directives cannot secure data that is shipped to the browser.

Required fix:

- import only public project data into client code;
- move drafts/private projects outside `src`;
- use a private CMS, repository directory excluded from builds, or authenticated backend for non-public records;
- scan the final bundle for private client names, claims and documents before release.

---

## 7. Robots, crawler policy and AI access

### 7.1 Current policy

Current `robots.txt`:

```text
User-agent: *
Allow: /
Sitemap: https://techsergy.com/sitemap.xml
Disallow: /api/
```

This is simple and generally crawl-friendly. It also permits named AI training bots through the wildcard rule unless a more specific group blocks them.

### 7.2 Separate search visibility from training permission

The major providers expose separate agents:

| Provider | Search/retrieval crawler | Training crawler | User-triggered agent |
|---|---|---|---|
| OpenAI | `OAI-SearchBot` | `GPTBot` | `ChatGPT-User` |
| Anthropic | `Claude-SearchBot` | `ClaudeBot` | `Claude-User` |
| Perplexity | `PerplexityBot` | No foundation-training use stated for this bot | `Perplexity-User` |
| Google | `Googlebot` controls Search and Search AI features | `Google-Extended` controls some non-Search AI uses | Product-dependent |

OpenAI explicitly allows a site to permit OAI-SearchBot while disallowing GPTBot. Anthropic similarly separates its search, training and user-directed bots. Perplexity states that PerplexityBot is for search and not foundation-model training. Google says Googlebot controls inclusion in Search AI features, while Google-Extended does not affect Google Search ranking.

### 7.3 Recommended policy option

If the business wants maximum search/citation visibility but does not want future content collected for general foundation-model training, use an explicit policy such as:

```text
User-agent: Googlebot
Allow: /
Disallow: /api/

User-agent: Bingbot
Allow: /
Disallow: /api/

User-agent: OAI-SearchBot
Allow: /
Disallow: /api/

User-agent: Claude-SearchBot
Allow: /
Disallow: /api/

User-agent: Claude-User
Allow: /
Disallow: /api/

User-agent: PerplexityBot
Allow: /
Disallow: /api/

User-agent: GPTBot
Disallow: /

User-agent: ClaudeBot
Disallow: /

User-agent: Google-Extended
Disallow: /

User-agent: *
Allow: /
Disallow: /api/

Sitemap: https://techsergy.com/sitemap.xml
```

This is a policy choice, not a universal recommendation. Omit the training blocks if TechSergy deliberately wants training inclusion.

Important caveats:

- user-triggered agents may not always be governed by robots rules;
- a WAF can accidentally block legitimate search bots even when robots allows them;
- verify crawler IPs using each provider’s official ranges before adding bypass rules;
- never trust a user-agent string alone;
- blocking Google-Extended does not block Google Search or Search AI features;
- robots exclusion is a cooperative protocol, not an access-control mechanism.

### 7.4 `llms.txt`

An `llms.txt` file is optional and low priority. Google explicitly states that no special AI text file or special AI schema is needed for its AI features. A concise `llms.txt` may help some experimental tools, but it should only summarize canonical, already-indexable pages and must not become a substitute for:

- complete HTML;
- strong internal links;
- accurate structured data;
- a sitemap;
- evidence-rich content;
- explicit robots policy.

---

## 8. Sitemap and URL inventory

### 8.1 Current sitemap

The sitemap contains only:

- `/`
- `/about`
- `/services`
- `/portfolio`
- `/contact`

It includes `changefreq` and `priority`, which Google ignores, and omits `lastmod`.

### 8.2 Recommended sitemap behavior

Generate the sitemap automatically from the same route/content data used to build pages. It should:

- include every canonical, indexable URL;
- exclude redirects, 404s, `noindex` pages and API endpoints;
- use accurate ISO-format `lastmod` values based on meaningful content changes;
- use the final canonical host, protocol and trailing-slash convention;
- update on content publication or modification;
- be submitted in Google Search Console and Bing Webmaster Tools;
- optionally be split into sitemap indexes if the site grows substantially.

Example:

```xml
<url>
  <loc>https://techsergy.com/case-studies/saas-support-llm-cost-reduction/</loc>
  <lastmod>2026-07-14</lastmod>
</url>
```

### 8.3 IndexNow

Use IndexNow to notify Bing and participating engines when URLs are added, updated or deleted. It does not guarantee indexing, but it can accelerate discovery and reduce reliance on periodic recrawling. Trigger it from the deployment pipeline or content-publishing workflow, not on every page view.

---

## 9. Information architecture and rankable surface area

### 9.1 Current limitation

Five broad pages force many distinct search intents into a small number of documents. Search engines rank URLs, not abstract sections of a company narrative. A single services page cannot be the best answer for every query related to:

- LLM cost optimization;
- OpenAI API cost reduction;
- model routing;
- model distillation;
- small language models;
- fine-tuning for cost reduction;
- self-hosted inference;
- API-versus-self-hosted economics;
- legal-document classification;
- mortgage-document extraction;
- SaaS support automation.

### 9.2 Recommended URL architecture

A strong initial structure:

```text
/
/about/
/about/naresh-joshi/
/contact/

/services/
/services/ai-inference-cost-audit/
/services/llm-cost-optimization/
/services/model-routing/
/services/model-distillation/
/services/model-fine-tuning/
/services/self-hosted-llm-inference/

/case-studies/
/case-studies/saas-support-llm-cost-reduction/
/case-studies/mortgage-underwriting-ai-automation/
/case-studies/legal-contract-classifier/

/guides/
/guides/llm-inference-cost-optimization/
/guides/reduce-openai-api-cost/
/guides/api-vs-self-hosted-llm-inference/
/guides/llm-model-routing/

/tools/
/tools/llm-inference-cost-calculator/
/tools/api-vs-self-hosted-break-even/

/benchmarks/
/benchmarks/llm-inference-cost-benchmark-2026/
```

This is a starting intent map, not a claim about keyword volume. Final prioritization should combine Search Console data, customer language, sales-call questions, paid-search data and competitor analysis.

### 9.3 Dedicated case-study pages

The homepage’s “View Case Study” links currently point to the generic portfolio page. Each result should instead have a stable URL containing:

1. Client context and anonymization statement.
2. Original architecture and cost baseline.
3. Workload volume and traffic pattern.
4. Model/provider versions and pricing date.
5. What was included in baseline and new cost.
6. Evaluation dataset and quality metrics.
7. Latency methodology.
8. Implementation architecture.
9. Before/after results.
10. Limitations and exceptions.
11. Delivery period.
12. Whether work was performed directly by TechSergy or in a prior role.
13. Reviewer or technical author.
14. CTA relevant to that use case.

This improves traditional ranking and makes the content materially more citable by AI systems.

### 9.4 Service pages

A service page should not be a thin variation of the same sales copy. Each should answer a distinct decision:

- who needs the service;
- signals that the current architecture is inefficient;
- what inputs are required;
- the audit or implementation method;
- quality and safety controls;
- deployment options;
- indicative timelines;
- what is delivered;
- relevant case studies;
- frequently asked technical questions;
- clear boundaries and unsuitable situations.

### 9.5 Tools and original research

The most defensible authority assets for this niche are not generic AI blog posts. They are:

- an LLM inference-cost calculator;
- a self-hosted break-even calculator;
- an inference-cost benchmark with reproducible assumptions;
- routing-quality and fallback-rate benchmarks;
- open-source evaluation scripts or notebooks;
- a model-cost/version change log;
- architecture diagrams and implementation checklists;
- anonymized, methodology-rich case studies.

These assets can earn links, demonstrate expertise and provide structured facts that search and AI systems can cite.

---

## 10. Content quality, evidence and entity trust

### 10.1 Strengths

The site already has several attributes that can support high-quality positioning:

- a narrow and expensive customer problem;
- a founder-led technical narrative;
- concrete methods rather than generic “AI transformation” language;
- quantified case-study outcomes;
- clear deployment options;
- practical answers about ownership, data and quality.

### 10.2 Current credibility gap

Claims such as 80–94% cost reduction, 98.2% accuracy, 680 ms P95 latency and reductions from tens of thousands of dollars per month are commercially powerful. Without visible methodology, they can also look promotional or cherry-picked to both users and machines.

Add a “How this was measured” section to every quantitative page. At minimum state:

- measurement dates;
- source pricing date;
- model/provider names and versions;
- request volume and average token profile;
- infrastructure and engineering costs included or excluded;
- quality metric definition;
- evaluation-set size and composition;
- whether the percentage is an observed result, estimate or projected range;
- exceptional cases routed to a frontier model;
- data-privacy constraints;
- client anonymity and permission status.

### 10.3 Reconcile conflicting claims

A statement such as “$0 third-party API after deploy” conflicts with case studies and FAQs that discuss hybrid routing and frontier models for exceptional inputs. Replace categorical claims with accurate language such as:

```text
Up to 100% reduction in third-party inference for suitable workloads.
```

or:

```text
Frontier APIs are retained only for exceptional cases where they add measurable value.
```

### 10.4 Establish “who, how and why”

Every expert or benchmark page should clearly show:

- who authored it;
- relevant credentials and project experience;
- who reviewed it;
- when it was published and updated;
- how results were generated;
- why the content was created;
- sources and assumptions;
- corrections policy where appropriate.

Google’s people-first guidance emphasizes original analysis, sourcing, expertise and clear authorship. The same qualities make content more useful to AI answer systems.

### 10.5 Entity consistency

Decide and publish one authoritative identity:

- brand name: TechSergy;
- legal operator: Exergy FZC, if verified;
- country and address policy;
- official email domain;
- founder identity;
- LinkedIn and other official profiles;
- service focus;
- geographic service area.

Apply it consistently across:

- website footer and contact page;
- structured data;
- privacy and terms pages;
- LinkedIn company profile;
- founder profile;
- Google Business Profile only if the business is eligible and has a genuine supported location/service model;
- directories, partner pages and media mentions;
- email signatures and proposals.

Do not retain contradictory Philippines and UAE signals under the same public entity.

---

## 11. Legacy-domain migration plan

Because the live domain currently contains unrelated WordPress content, launching the React site is a high-risk migration unless handled deliberately.

### 11.1 Before launch

1. Export a complete list of legacy URLs.
2. Pull Google Search Console pages, queries, links and indexing reports.
3. Export analytics landing-page and referral data.
4. Crawl the old site and record status, canonical, title and inbound-link targets.
5. Inventory backlinks with first-party Search Console data and a reputable link tool.
6. Decide whether any old articles are genuinely useful to the new audience.
7. Prepare a URL-by-URL migration map.
8. Test the new site on a staging host protected by authentication or `noindex`.
9. Verify production robots, sitemap, headers, canonicals, redirects and 404s before DNS cutover.

### 11.2 Redirect rules

- Redirect only when there is a genuinely equivalent replacement.
- Do not redirect every old post to the homepage; unrelated blanket redirects can be treated as soft 404s and confuse users.
- Return 404 or 410 for obsolete, unlinked and non-equivalent pages.
- Consider moving valuable but unrelated legacy editorial content to a separate domain rather than mixing two brands.
- Avoid redirect chains.
- Preserve query parameters needed for campaign attribution.
- Keep redirects active long enough for users, search engines and external links to transition.

### 11.3 After launch

- submit the new sitemap;
- inspect the homepage and priority URLs in Search Console;
- monitor 404s, soft 404s, alternate canonicals and crawled-not-indexed reports;
- monitor crawl logs and bot blocks;
- compare old and new query/topic visibility;
- update high-value external links where possible;
- monitor branded searches for the old Philippines/blog identity;
- publish a clear About page that resolves the new entity immediately.

Expect temporary volatility while search systems re-evaluate the domain’s topic and organization identity. This should be managed, not interpreted as proof that the new site cannot rank.

---

## 12. Analytics and measurement audit

### 12.1 Current implementation

The repository contains a GA4 tag but no event instrumentation elsewhere. It therefore lacks a code-defined answer to these business questions:

- Which landing pages generate audit requests?
- Do React route changes create separate page views?
- Which case study creates the strongest conversion intent?
- Which CTA location performs best?
- How many users start but fail the form?
- Are Turnstile or API errors suppressing conversions?
- Which leads become qualified, scheduled and closed?
- What is the contribution of Google organic, Bing, ChatGPT, Perplexity, Claude, LinkedIn and referrals?
- Which query themes generate business value rather than traffic alone?

### 12.2 SPA page-view tracking

GA4 can measure history changes through Enhanced Measurement, or the site can send explicit virtual page views. Do not use both without configuration, because duplicate page views can result.

A code-controlled implementation could initialize with automatic page-view sending disabled:

```js
gtag('config', 'G-CQBCN8B9JT', {
  send_page_view: false
});
```

Then send a page view after each route change and after the title has been updated:

```js
gtag('event', 'page_view', {
  page_title: document.title,
  page_location: window.location.href,
  page_path: location.pathname + location.search
});
```

Validate in GA4 DebugView that:

- the initial route fires once;
- each navigation fires once;
- browser back/forward is measured;
- `page_location` is correct;
- source attribution is not overwritten;
- title values correspond to the new route.

### 12.3 Recommended event taxonomy

| Stage | Event | Trigger | Key parameters |
|---|---|---|---|
| Discovery | `page_view` | Initial load and every SPA route | page path, title, content group |
| Intent | `cta_click` | Audit/contact CTA click | CTA ID, placement, source page |
| Proof | `case_study_view` | Case-study page viewed | case-study ID, industry |
| Engagement | `case_study_expand` | Expand interaction | case-study ID, section |
| Form | `form_start` | First meaningful field interaction | form ID, source page |
| Form | `form_submit_attempt` | Submit button pressed | form ID, validation state |
| Lead | `generate_lead` | API-confirmed successful submission | lead source, form ID |
| Error | `form_error` | Client, Turnstile or API failure | error category, not free-text message |
| Referral | `outbound_click` | External profile or email link | destination domain, link ID |
| Performance | `web_vital` | Field metric captured | metric name, value, rating |
| Sales | `qualify_lead` | CRM qualification | lead ID hash or safe internal key, source |
| Revenue | `close_convert_lead` | Signed/converted customer | value, currency, source |

Use GA4’s recommended `generate_lead` event only after the backend confirms success, not merely when a user clicks submit.

### 12.4 Privacy rules

Do not send the following to Google Analytics:

- name;
- email;
- phone number;
- company name when it can identify an individual;
- form free text;
- full IP address;
- raw Turnstile or provider error bodies;
- client-confidential project details.

Use controlled enumerations for form type, service interest, error category and page ID. Implement consent and privacy handling appropriate to actual markets, data practices and legal advice.

### 12.5 Attribution

Persist first-touch and last-touch parameters in first-party storage, subject to consent and policy:

- `utm_source`;
- `utm_medium`;
- `utm_campaign`;
- `utm_content`;
- `utm_term`;
- landing page;
- referrer domain;
- click IDs where applicable.

ChatGPT referrals may include `utm_source=chatgpt.com`, but also classify referral domains so measurement is not dependent on one parameter. Define an “AI referral” channel grouping for observable traffic from ChatGPT, Perplexity, Claude and other answer engines. Treat this as referral measurement, not a complete measure of AI citations—many citations do not generate a click.

### 12.6 Offline and CRM outcomes

A B2B lead form is not the final business outcome. Connect web activity to:

- qualified lead;
- audit booked;
- proposal issued;
- opportunity created;
- won/lost;
- expected and realized revenue.

Google Analytics Measurement Protocol can supplement client-side tagging with server-side or offline events. It should augment, not replace, browser tagging. A CRM or warehouse should remain the system of record.

### 12.7 Search and AI measurement stack

Use:

1. **Google Search Console** for query, page, country, device, impressions, clicks, CTR, average position, indexing and Core Web Vitals.
2. **GA4** for landing-page behavior, CTA rate, form progression and leads.
3. **Bing Webmaster Tools** for crawl/indexing, search performance and its AI Performance dashboard, which reports citations, cited pages and grounding-query samples.
4. **Server/CDN logs** for verified crawler activity, status codes, blocked resources, latency and crawl patterns.
5. **CRM reporting** for lead quality and revenue.
6. **Optional rank tracking** for a carefully chosen query set, segmented by country and device.
7. **Periodic AI answer sampling** with a documented prompt set, recognizing that AI outputs vary and are not a stable rank position.

### 12.8 Recommended dashboard

A weekly executive dashboard should show:

- indexed canonical URLs;
- non-indexed priority URLs by reason;
- organic clicks and impressions;
- non-brand versus brand queries;
- top service and case-study landing pages;
- CTR by page and query cluster;
- leads and qualified leads by source/landing page;
- organic-to-lead and lead-to-qualified conversion rates;
- AI referral sessions and leads;
- Bing AI citations and cited pages;
- LCP, INP and CLS pass rates;
- 404s, redirect errors and blocked-bot incidents;
- new referring domains to evidence assets.

A monthly strategy review should add:

- content published and updated;
- query/topic gains and losses;
- pages with impressions but poor CTR;
- pages with traffic but weak commercial conversion;
- case-study and tool link acquisition;
- sales-call questions that should become content;
- claim/data refresh requirements.

---

## 13. Performance and Core Web Vitals

### 13.1 Current risks

The existing production output includes one primary JavaScript bundle of approximately 822 KB uncompressed. Every page is eagerly imported, and all public and hidden project data are included. Large logo assets are also present, and the page loads Turnstile and two font providers globally.

This can affect:

- Largest Contentful Paint through CSS/font/image dependencies;
- Interaction to Next Paint through JavaScript parsing, execution and animation;
- crawl efficiency and rendered-page reliability;
- conversion on mobile or slower networks.

No production field data was available in this audit, so these are implementation risks rather than measured Core Web Vitals failures.

### 13.2 Recommended changes

1. Pre-render or statically generate every route.
2. Lazy-load route components if client-side navigation remains.
3. Load Turnstile only on the contact page or when the form approaches the viewport.
4. Remove private and unused data from the bundle.
5. Audit Material UI component and icon imports.
6. Compress raster assets and use responsive WebP/AVIF where suitable.
7. Use a dedicated, optimized social image separate from the on-page logo.
8. Self-host or subset fonts where licensing permits; reduce weights and providers.
9. Preload only the actual above-the-fold font/image resources.
10. Respect `prefers-reduced-motion` and remove perpetual nonessential animation.
11. Add long-lived immutable caching for hashed assets.
12. Keep HTML and metadata rapidly revalidatable.
13. Measure field metrics through Search Console and Real User Monitoring.

Google’s current “good” Core Web Vitals thresholds are approximately:

- LCP at or below 2.5 seconds;
- INP below 200 milliseconds;
- CLS at or below 0.1;

measured at the 75th percentile. Passing them does not guarantee rankings, but poor page experience can suppress performance and conversion.

---

## 14. Accessibility and machine-operable semantics

Accessibility improvements also help browser agents understand and operate the site.

### Current issues

- featured-work arrow buttons lack descriptive `aria-label` values;
- carousel dots are clickable layout elements rather than semantic buttons;
- carousel selection state is not exposed;
- case-study disclosure controls lack `aria-expanded` and `aria-controls`;
- slide changes are not announced;
- no skip-to-main-content link was identified;
- motion does not adapt to reduced-motion preferences;
- some noninteractive cards use pointer cues.

### Required patterns

- use real `<button>` or linked controls;
- give controls stable, descriptive names;
- expose selected/current state with `aria-current` or appropriate state attributes;
- connect disclosures to their content region;
- maintain visible keyboard focus;
- ensure all navigation and conversion paths work without a pointer;
- keep primary text in the accessibility tree;
- test with keyboard, screen reader and an automated accessibility tool;
- preserve semantic heading order.

OpenAI’s browser/agent guidance explicitly notes the usefulness of ARIA labels, roles and states. These changes should be treated as usability engineering, not as keyword optimization.

---

## 15. Search-ranking strategy

Technical SEO creates eligibility and clarity. It does not independently create authority or demand. Ranking growth should combine five workstreams.

### 15.1 Technical eligibility

- complete pre-rendered HTML;
- correct status codes;
- page-specific canonicals and metadata;
- clean sitemap;
- crawlable internal links;
- accurate structured data;
- no hidden-client-data exposure;
- secure and performant delivery;
- Search Console and Bing verification.

### 15.2 Topic architecture

Build a coherent cluster around production inference economics rather than publishing generic AI news. Core themes:

- inference cost drivers;
- token and context economics;
- model routing;
- fallback architecture;
- distillation;
- task-specific fine-tuning;
- small language models;
- quantization and serving;
- self-hosted versus API break-even;
- quality evaluation;
- latency and throughput;
- security and data residency;
- industry-specific document and support workloads.

Every guide should link to the relevant service, tool and case study, and those commercial pages should link back to the evidence.

### 15.3 Original evidence

Publish material others can cite:

- reproducible benchmarks;
- calculators;
- source assumptions;
- architecture diagrams;
- evaluation methodologies;
- open-source utilities;
- technical postmortems;
- anonymized datasets where possible;
- client-approved results.

This is likely to outperform a high volume of generic, AI-written articles.

### 15.4 Authority and links

Earn relevant links and mentions through:

- partner and client pages where permission exists;
- founder engineering articles;
- technical conference talks and podcasts;
- original benchmark reports;
- open-source projects;
- guest contributions to credible AI infrastructure and FinOps publications;
- vendor implementation directories;
- academic/industry collaborations;
- data-backed commentary on major model-pricing changes.

Avoid paid link schemes, mass directories, irrelevant guest posts and republished low-value content.

### 15.5 Conversion and trust

Rankings have limited value if buyers cannot verify credibility. Improve:

- visible legal/operator identity;
- privacy and terms pages;
- case-study methodology;
- founder credentials;
- client attribution permissions;
- clear engagement model;
- realistic timelines and boundaries;
- direct contact fallback when Turnstile fails;
- proof-oriented CTAs by page intent.

---

## 16. Competitive search impression

A sample of current results for AI/LLM cost-optimization queries shows competitors publishing dedicated service pages, calculators, detailed technical explanations and case studies. Several present explicit methods such as routing, caching, prompt/token optimization and self-hosted economics.

TechSergy’s advantage is sharper specialization and stronger claimed outcomes. Its disadvantage is that those strengths are compressed into a few broad pages and are not supported by the same volume of indexable methodology, tools and source material.

The response should not be to copy competitor wording. It should be to make TechSergy’s actual expertise more inspectable:

- one URL per decision or case;
- transparent methodology;
- original numbers;
- clear authorship;
- tools that demonstrate economics;
- technical depth that proves the service can be delivered.

---

## 17. Recommended implementation blueprint

### 17.1 Route/content manifest

Create a typed metadata source:

```js
export const pages = {
  home: {
    path: '/',
    title: 'AI Inference Cost Optimization | TechSergy',
    description: 'Reduce production LLM inference spend...',
    image: '/social/home-1200x630.jpg',
    changeDate: '2026-07-14'
  },
  services: {
    path: '/services/',
    title: 'AI Inference Optimization Services | TechSergy',
    description: 'Audit, route, distill, fine-tune and self-host...',
    image: '/social/services-1200x630.jpg',
    changeDate: '2026-07-14'
  }
};
```

Use this to generate:

- routes;
- static HTML head tags;
- sitemap entries;
- navigation;
- breadcrumbs;
- Open Graph/Twitter metadata;
- JSON-LD IDs;
- analytics content-group values.

Add schema validation so a build fails when a canonical, title, description, image, date or required content field is missing.

### 17.2 Metadata component/template

Each page should emit in initial HTML:

```html
<title>...</title>
<meta name="description" content="...">
<link rel="canonical" href="...">
<meta name="robots" content="index,follow,max-image-preview:large">

<meta property="og:type" content="website">
<meta property="og:site_name" content="TechSergy">
<meta property="og:locale" content="en_US">
<meta property="og:url" content="...">
<meta property="og:title" content="...">
<meta property="og:description" content="...">
<meta property="og:image" content="...">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="...">

<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="...">
<meta name="twitter:description" content="...">
<meta name="twitter:image" content="...">
<meta name="twitter:image:alt" content="...">
```

Use `article` metadata only on genuine editorial or case-study article pages.

### 17.3 Build-time QA

Add automated checks for:

- one unique title and description per indexable URL;
- one self-referencing canonical;
- no canonical to a redirect or 404;
- one visible H1;
- no broken internal links;
- JSON-LD parse and required fields;
- no `noindex` page in sitemap;
- no private projects or client markers in bundle;
- image dimensions and file-size budgets;
- correct 404 response;
- robots and sitemap availability;
- page HTML containing meaningful text without executing JavaScript;
- analytics event smoke tests;
- accessibility checks.

---

## 18. Prioritized action plan

### Phase 0: Release blockers

| Priority | Action | Impact | Effort |
|---|---|---:|---:|
| P0 | Decide and execute the legacy-domain migration | Very high | High |
| P0 | Pre-render/static-generate all public URLs | Very high | Medium–high |
| P0 | Return route-specific metadata and canonical in initial HTML | Very high | Medium |
| P0 | Replace stale/deprecated JSON-LD with a verified entity graph | High | Medium |
| P0 | Create a true 404 response and catch-all route | High | Low–medium |
| P0 | Remove hidden project data from the client build | High | Low |
| P0 | Verify and publish one legal/brand/contact identity | High | Medium |
| P0 | Add privacy/terms treatment appropriate to actual data practices | High | Medium |
| P0 | Explicitly measure successful lead generation | Very high | Low–medium |

### Phase 1: First 30 days after technical foundation

| Priority | Action | Impact | Effort |
|---|---|---:|---:|
| P1 | Add standalone service and case-study pages | Very high | High |
| P1 | Add methodology and evidence to all quantitative claims | Very high | Medium–high |
| P1 | Generate sitemap with accurate `lastmod` | Medium | Low |
| P1 | Configure Search Console, Bing Webmaster and IndexNow | High | Low |
| P1 | Implement reliable SPA/route analytics or validate SSG page views | High | Medium |
| P1 | Add funnel and error events | High | Medium |
| P1 | Optimize JS, images, fonts and Turnstile loading | High | Medium |
| P1 | Fix ARIA and keyboard behavior | Medium | Medium |
| P1 | Define explicit AI search/training robots policy | Medium | Low |
| P1 | Configure WAF to allow verified desired bots | Medium | Low–medium |

### Phase 2: 30–90 days

| Priority | Action | Impact | Effort |
|---|---|---:|---:|
| P2 | Publish an inference-cost calculator | Very high | Medium–high |
| P2 | Publish a transparent benchmark/report | Very high | High |
| P2 | Build the core guide cluster | High | High |
| P2 | Launch link-earning and technical-PR program | High | Ongoing |
| P2 | Connect CRM/offline lead outcomes | Very high | Medium |
| P2 | Build executive search/lead dashboard | High | Medium |
| P2 | Test metadata and CTA variants using real data | Medium | Ongoing |
| P2 | Add optional `llms.txt` after canonical content is mature | Low | Low |

---

## 19. Success criteria

The technical foundation is complete when:

- every canonical URL returns complete meaningful HTML without JavaScript;
- every URL returns correct title, description, canonical, social metadata and JSON-LD in the initial response;
- unknown URLs return a true 404;
- no private project content appears in client assets;
- the sitemap includes all and only canonical indexable URLs;
- Search Console can render and index priority pages without canonical conflicts;
- live public identity matches the intended business across page content and structured data;
- route/page views are recorded once;
- a successful form submission records one `generate_lead` event;
- errors are measurable without collecting personal data;
- field Core Web Vitals meet the desired thresholds for most visits;
- desired AI search crawlers are allowed through both robots and WAF;
- training crawler access reflects an explicit company decision.

The growth program is working when:

- non-brand impressions expand across relevant inference-cost query clusters;
- dedicated service/case-study pages receive impressions independently;
- organic click-through improves on high-impression pages;
- qualified leads can be attributed to landing pages and sources;
- benchmark, tool and case-study pages earn relevant links and citations;
- Bing AI Performance begins reporting cited pages and grounding queries;
- AI referral traffic and qualified lead contribution are visible;
- branded results consistently describe the AI cost-optimization company rather than the legacy blog.

---

## 20. Important limitations

This audit did not have access to:

- Google Search Console;
- GA4 property configuration or reports;
- Bing Webmaster Tools;
- Cloudflare production headers, WAF rules or request logs;
- production field Core Web Vitals;
- complete backlink data;
- CRM or lead-quality data;
- the final deployed React site, because the public domain still serves the legacy WordPress site.

Therefore this report can evaluate implementation, machine signals and public identity, but it cannot truthfully state current Google rankings, indexed-page counts, conversion rates, bot crawl volume or real-user performance. Those should be established as the baseline immediately before and after launch.

---

## 21. Source notes

Primary external references consulted:

- Google Search Central, “Understand JavaScript SEO Basics” — `https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics`
- Google Search Central, “AI Features and Your Website” — `https://developers.google.com/search/docs/appearance/ai-features`
- Google Search Central, “Creating helpful, reliable, people-first content” — `https://developers.google.com/search/docs/fundamentals/creating-helpful-content`
- Google Search Central, “Organization structured data” — `https://developers.google.com/search/docs/appearance/structured-data/organization`
- Google Search Central, “Site names” — `https://developers.google.com/search/docs/appearance/site-names`
- Google Search Central, sitemap guidance — `https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview`
- Google Search Central, Core Web Vitals — `https://developers.google.com/search/docs/appearance/core-web-vitals`
- Google Analytics, SPA measurement guidance — `https://developers.google.com/analytics/devguides/collection/ga4/measure-spa-gtm`
- Google Analytics, recommended lead events — `https://developers.google.com/analytics/devguides/collection/ga4/reference/events`
- Google Analytics, Measurement Protocol — `https://developers.google.com/analytics/devguides/collection/protocol/ga4`
- OpenAI, “Overview of OpenAI Crawlers” — `https://developers.openai.com/api/docs/bots`
- Anthropic Privacy Center, crawler policy — `https://privacy.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler`
- Perplexity, crawler documentation — `https://docs.perplexity.ai/docs/resources/perplexity-crawlers`
- Bing Webmaster Blog, “Introducing AI Performance” — `https://blogs.bing.com/webmaster/February-2026/Introducing-AI-Performance-in-Bing-Webmaster-Tools-Public-Preview`
- IndexNow documentation — `https://www.indexnow.org/documentation`
- Schema.org, `ProfessionalService` — `https://schema.org/ProfessionalService`
- Public TechSergy website observed on 14 July 2026 — `https://techsergy.com/`

---

## Final assessment

TechSergy can build a strong organic-search and AI-citation position because the niche is specific, economically important and suited to original technical evidence. The current repository already contains the beginning of that story. The main task is to make the story consistent and inspectable to machines.

The correct sequence is:

1. resolve the public-domain identity;
2. return complete route-specific HTML;
3. align metadata and structured data with the specialist proposition;
4. give every service, case study and evidence asset a stable URL;
5. publish methodology-rich proof;
6. measure the complete lead funnel;
7. improve performance, accessibility and crawler policy;
8. earn authority through tools, benchmarks and relevant references.

Until the first four are complete, publishing more generic articles would create volume without fixing the underlying machine-confidence problem.
