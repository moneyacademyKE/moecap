import type { AssetMetadata, ContentNode, ContentLink, SiteMetadata } from './assets';

export function renderAssetLink(asset: AssetMetadata): string {
	const url = `/${asset.id}`;
	return `
    <article class="asset-item">
      <span><a href="${url}" target="_blank">${asset.name}</a></span>
      <span class="meta">${asset.extension.toUpperCase()} (${(asset.sizeBytes / 1024).toFixed(1)} KB)</span>
    </article>`;
}

export function renderLinkGroup(links: ContentLink[]): string {
	return links.map(link => `
    <article class="link-item">
      <span><a href="${link.url}" target="_blank">${link.label}</a></span>
      <span class="meta">${link.note || ''}</span>
    </article>
  `).join('');
}

export function renderMetricCard(title: string, metrics: Record<string, string>): string {
	const rows = Object.entries(metrics).map(([k, v]) => `
    <div class="metric-row">
      <span class="label">${k}</span>
      <span class="value">${v}</span>
    </div>
  `).join('');
	return title ? `<h3>${title}</h3>\n${rows}` : rows;
}

export function renderNode(node: ContentNode): string {
	let innerHtml = '';

	switch (node.type) {
		case 'ARTICLE':
			innerHtml = `
        ${node.metrics ? renderMetricCard('', node.metrics) : ''}
        ${node.content}
      `;
			break;
		case 'LINK_LIST':
			innerHtml = node.links ? renderLinkGroup(node.links) : '';
			break;
		case 'METRIC_CARD':
			innerHtml = node.metrics ? renderMetricCard(node.title, node.metrics) : '';
			break;
		case 'ASSET_LIST':
			innerHtml = `${node.extraHtml ?? ''}\n<div class="asset-grid">${node.assets ? node.assets.map(renderAssetLink).join('\n') : ''}</div>`;
			break;
	}

	return `
    <details id="${node.id}">
      <summary>${node.title}</summary>
      <section class="content-body">
        ${innerHtml}
      </section>
    </details>
  `;
}

export function renderPage(nodes: ContentNode[], metadata?: SiteMetadata): string {
    const categories = Array.from(new Set(nodes.map(n => n.category))).sort();
    
    // Group nodes by category
    const groupedContent = categories.map(cat => {
        const catNodes = nodes.filter(n => n.category === cat);
        const navId = cat.toLowerCase().replace(/\s+/g, '-');
        return `
        <section id="${navId}" class="category-section">
            <h2 class="category-header">${cat}</h2>
            <div class="category-nodes">
                ${catNodes.map(renderNode).join('\n')}
            </div>
        </section>`;
    }).join('\n');

    // Render de-complected site metadata if present
    let brandHeader = '';
    let bioSection = '';
    
    if (metadata) {
        brandHeader = `
            <h1>${metadata.title}</h1>
            <p class="tagline">${metadata.tagline}</p>
        `;
        
        bioSection = `
            <div class="profile-card">
                <p class="bio">${metadata.bio}</p>
                
                <p class="crypto-note">
                    🚀 Read our <a href="${metadata.substackFeed.url}" target="_blank">${metadata.substackFeed.label}</a>.
                </p>
                
                <div class="social-badges">
                    ${metadata.socials.map(soc => `
                        <a href="${soc.url}" class="social-badge" target="_blank">[ ${soc.platform}: ${soc.handle} ]</a>
                    `).join('')}
                </div>
            </div>

            <div class="meta-grid">
                <div class="meta-card">
                    <div class="card-tag">[ WATCHLIST ]</div>
                    <h3>Active Focus</h3>
                    <ul>
                        ${metadata.watchlist.stocks.map(s => `<li>${s}</li>`).join('')}
                    </ul>
                    <p class="card-desc">${metadata.watchlist.description}</p>
                </div>
                
                <div class="meta-card">
                    <div class="card-tag">[ HISTORICAL ]</div>
                    <h3>Cornerstone Picks</h3>
                    <ul>
                        ${metadata.historicalPicks.stocks.map(s => `<li>${s}</li>`).join('')}
                    </ul>
                    <p class="card-desc">${metadata.historicalPicks.description}</p>
                </div>

                <div class="meta-card">
                    <div class="card-tag">[ PARTNERSHIP ]</div>
                    <h3>Co-Investing Terms</h3>
                    <div class="metric-row">
                        <span class="label">Management Fee</span>
                        <span class="value">${metadata.partnershipTerms.fee}</span>
                    </div>
                    <div class="metric-row">
                        <span class="label">Hurdle Rate</span>
                        <span class="value">${metadata.partnershipTerms.hurdle}</span>
                    </div>
                    <div class="metric-row">
                        <span class="label">Performance Fee</span>
                        <span class="value">${metadata.partnershipTerms.performanceAllocation}</span>
                    </div>
                    <p class="card-desc" style="margin-top: 0.75rem;">${metadata.partnershipTerms.description}</p>
                </div>

                <div class="meta-card action-card">
                    <div class="card-tag">[ CAMPAIGNS ]</div>
                    <h3>Collaborations</h3>
                    <p class="card-desc" style="margin-bottom: 1.5rem;">We participate in select key opinion leader campaigns and investment research distributions.</p>
                    <a class="action-btn" href="${metadata.kolCampaign.url}" download>→ View Campaign PDF</a>
                </div>
            </div>
        `;
    } else {
        brandHeader = `
            <h1>MoeCapital</h1>
            <p>Unified Financial Research & Asset Library</p>
        `;
    }

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Moe Capital | Premium Financial Intelligence</title>
    <style>
        :root {
            --bg: hsl(205, 45%, 8%);
            --surface: hsl(205, 40%, 12%);
            --surface-hover: hsl(205, 38%, 15%);
            --accent: hsl(45, 100%, 55%);
            --link: hsl(150, 60%, 65%);
            --text: hsl(205, 10%, 88%);
            --meta: hsl(205, 20%, 60%);
            --border: hsl(205, 30%, 20%);
            --bg-code: hsl(205, 35%, 15%);
            --shadow: rgba(0, 0, 0, 0.4);
            --transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @media (prefers-color-scheme: light) {
            :root {
                --bg: hsl(205, 30%, 97%);
                --surface: hsl(0, 0%, 100%);
                --surface-hover: hsl(205, 20%, 94%);
                --accent: hsl(205, 80%, 35%);
                --link: hsl(355, 60%, 45%);
                --text: hsl(205, 40%, 15%);
                --meta: hsl(205, 15%, 45%);
                --border: hsl(205, 20%, 85%);
                --bg-code: hsl(205, 25%, 92%);
                --shadow: rgba(0, 0, 0, 0.05);
            }
        }

        * { box-sizing: border-box; }

        body {
            background: var(--bg);
            color: var(--text);
            font-family: 'JetBrains Mono', 'Fira Code', 'IBM Plex Mono', ui-monospace, monospace;
            line-height: 1.6;
            margin: 0;
            padding: 4rem 2rem;
            display: flex;
            justify-content: center;
            transition: background 0.3s ease;
        }

        main {
            width: 100%;
            max-width: 75ch;
        }

        h1, h2, h3 { color: var(--accent); margin-top: 2.5rem; font-weight: 600; }
        h1::before { content: '# '; opacity: 0.5; }
        h2::before { content: '## '; opacity: 0.5; }
        h3::before { content: '### '; opacity: 0.5; }

        header { text-align: left; margin-bottom: 3rem; }
        header h1 { margin: 0; font-size: 2.2rem; letter-spacing: -0.02em; }
        header .tagline { color: var(--meta); margin: 0.5rem 0 0 0; font-size: 1rem; }

        .profile-card {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: 6px;
            padding: 2rem;
            margin-bottom: 2rem;
            box-shadow: 0 4px 20px var(--shadow);
        }

        .profile-card .bio {
            font-size: 1.05rem;
            margin-top: 0;
            color: var(--text);
        }

        .profile-card .crypto-note {
            font-size: 0.95rem;
            margin: 1.5rem 0 0 0;
            padding: 0.75rem 1rem;
            background: var(--bg-code);
            border-left: 3px solid var(--accent);
            border-radius: 0 4px 4px 0;
        }

        .social-badges {
            display: flex;
            flex-wrap: wrap;
            gap: 0.75rem;
            margin-top: 1.5rem;
        }

        .social-badge {
            text-decoration: none;
            font-size: 0.75rem;
            font-weight: 500;
            padding: 0.3rem 0.8rem;
            border: 1px solid var(--border);
            border-radius: 4px;
            background: var(--bg-code);
            color: var(--meta);
            transition: var(--transition);
        }

        .social-badge:hover {
            color: var(--bg);
            background: var(--accent);
            border-color: var(--accent);
            transform: translateY(-1px);
        }

        .meta-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 1.5rem;
            margin-bottom: 4rem;
        }

        .meta-card {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: 6px;
            padding: 1.5rem;
            display: flex;
            flex-direction: column;
            box-shadow: 0 4px 20px var(--shadow);
            transition: var(--transition);
        }

        .meta-card:hover {
            border-color: var(--accent);
            transform: translateY(-2px);
            box-shadow: 0 8px 30px var(--shadow);
        }

        .meta-card h3 {
            margin-top: 0.25rem;
            margin-bottom: 1rem;
            font-size: 1.1rem;
        }

        .card-tag {
            font-size: 0.7rem;
            color: var(--accent);
            letter-spacing: 0.05em;
            font-weight: 700;
        }

        .card-desc {
            font-size: 0.8rem;
            color: var(--meta);
            margin-top: auto;
            margin-bottom: 0;
            line-height: 1.5;
        }

        .action-card {
            background: linear-gradient(135deg, var(--surface) 0%, var(--bg-code) 100%);
        }

        .action-btn {
            display: inline-block;
            text-align: center;
            text-decoration: none;
            font-size: 0.8rem;
            font-weight: 700;
            padding: 0.6rem 1.2rem;
            border: 1px solid var(--accent);
            border-radius: 4px;
            color: var(--accent);
            background: transparent;
            transition: var(--transition);
            margin-top: auto;
            align-self: flex-start;
        }

        .action-btn:hover {
            background: var(--accent);
            color: var(--bg);
            box-shadow: 0 4px 15px rgba(255, 220, 9, 0.2);
            transform: translateY(-1px);
        }

        nav {
            display: flex;
            gap: 1rem;
            flex-wrap: wrap;
            margin-bottom: 4rem;
            padding: 1rem 0;
            border-top: 1px solid var(--border);
            border-bottom: 1px solid var(--border);
            position: sticky;
            top: 0;
            background: var(--bg);
            z-index: 10;
            backdrop-filter: blur(10px);
        }

        nav a {
            text-decoration: none;
            color: var(--meta);
            font-size: 0.85rem;
            transition: color 0.2s;
        }

        nav a::before { content: '['; margin-right: 2px; }
        nav a::after { content: ']'; margin-left: 2px; }
        nav a:hover { color: var(--accent); }

        a { color: var(--link); text-decoration: none; transition: opacity 0.2s; }
        a:hover { opacity: 0.8; text-decoration: underline; }

        .category-header {
            margin-bottom: 2rem;
            padding-bottom: 0.5rem;
            border-bottom: 1px solid var(--border);
            font-size: 1.2rem;
            text-transform: uppercase;
            letter-spacing: 0.1em;
        }

        details { 
            margin-bottom: 1.5rem; 
            border: 1px solid var(--border);
            background: var(--surface);
            border-radius: 6px;
            transition: var(--transition);
            overflow: hidden;
            box-shadow: 0 2px 10px var(--shadow);
        }
        
        details:hover { border-color: var(--accent); }

        summary {
            padding: 1.2rem;
            cursor: pointer;
            color: var(--text);
            font-weight: 500;
            list-style: none;
            display: flex;
            align-items: center;
            user-select: none;
            transition: background 0.2s;
        }
        
        summary:hover {
            background: var(--surface-hover);
        }
        
        summary::-webkit-details-marker { display: none; }
        summary::before { 
            content: '>>'; 
            color: var(--accent); 
            margin-right: 1.5ch; 
            font-size: 0.8rem;
            opacity: 0.7;
            transition: transform 0.25s ease;
        }

        details[open] summary {
            border-bottom: 1px solid var(--border);
            color: var(--accent);
            background: var(--surface-hover);
        }

        details[open] summary::before {
            transform: rotate(90deg);
        }

        .content-body {
            padding: 1.8rem;
            font-size: 0.9rem;
            background: var(--surface);
        }

        .content-body h2 {
            font-size: 1.3rem;
            border-bottom: 1px solid var(--border);
            padding-bottom: 0.5rem;
            margin-top: 2rem;
            margin-bottom: 1rem;
        }

        .content-body h3 {
            font-size: 1.1rem;
            margin-top: 1.5rem;
            margin-bottom: 0.75rem;
        }

        .metric-row, .asset-item, .link-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0.75rem 0;
            border-bottom: 1px solid var(--border);
        }

        .metric-row:last-child, .asset-item:last-child, .link-item:last-child { 
            border-bottom: none; 
        }

        .label { color: var(--meta); }
        .value { color: var(--accent); font-weight: 500; }
        .meta { font-size: 0.75rem; color: var(--meta); opacity: 0.8; }

        ul { list-style: none; padding-left: 0; }
        ul li { margin-bottom: 0.5rem; display: flex; align-items: flex-start; }
        ul li::before { content: '- '; color: var(--accent); margin-right: 1ch; flex-shrink: 0; }

        hr { border: 0; border-top: 1px solid var(--border); margin: 3rem 0; }

        .asset-grid {
            display: grid;
            gap: 0.5rem;
        }

        .book-notes-block { margin-bottom: 2.5rem; }
        .book-notes-header { margin-top: 0; }
        .book-note { margin-bottom: 1rem; }
        .book-note > summary { font-weight: 600; }
        .book-body { padding: 0.5rem 1.2rem 1.2rem 1.2rem; }
        .book-tldr { color: var(--text); margin-top: 0.75rem; }
        .book-takeaways { margin-bottom: 1rem; }
        .book-meta { font-size: 0.75rem; color: var(--meta); border-bottom: 1px solid var(--border); padding-bottom: 1rem; }
        .chapter-note { background: var(--bg-code); margin: 0.5rem 0; border-radius: 4px; box-shadow: none; }
        .chapter-note > summary { padding: 0.7rem 1rem; font-size: 0.85rem; }
        .chapter-body { padding: 0.25rem 1.2rem 1rem 1.2rem; font-size: 0.85rem; }
        .chapter-tldr { color: var(--text); margin-top: 0.25rem; }
        .chapter-body ul { margin: 0.5rem 0; }
        .chapter-quote {
            border-left: 3px solid var(--accent);
            margin: 0.75rem 0;
            padding: 0.5rem 1rem;
            background: var(--surface);
            border-radius: 0 4px 4px 0;
            color: var(--meta);
            font-style: italic;
        }
        .chapter-action { color: var(--accent); }

        footer {
            margin-top: 6rem;
            padding-bottom: 4rem;
        }

        @media (max-width: 768px) {
            body { padding: 2rem 1rem; }
            nav { gap: 0.5rem; }
            .meta-grid {
                grid-template-columns: 1fr;
                gap: 1rem;
            }
            header h1 { font-size: 1.8rem; }
        }
    </style>
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            // Smooth accordion open/scroll
            document.querySelectorAll('nav a[href^="#"]').forEach(anchor => {
                anchor.addEventListener('click', function(e) {
                    e.preventDefault();
                    const targetId = this.getAttribute('href').substring(1);
                    const targetSection = document.getElementById(targetId);
                    if (targetSection) {
                        targetSection.scrollIntoView({ behavior: 'smooth' });
                    }
                });
            });
        });
    </script>
</head>
<body>
    <main>
        <header>
            ${brandHeader}
        </header>
        
        ${bioSection}
        
        <nav>
            ${categories.map(cat => `<a href="#${cat.toLowerCase().replace(/\s+/g, '-')}">${cat}</a>`).join('')}
            <a href="/nse" style="color: var(--link); font-weight: bold; border: 1px solid var(--link); border-radius: 4px; padding: 2px 8px; margin-left: 0.5rem; text-decoration: none;">[ NSE Terminal ]</a>
        </nav>
        
        <article>
            ${groupedContent}
        </article>

        <footer>
            <hr>
            <p style="font-size: 0.75rem; color: var(--meta); text-align: center; opacity: 0.6;">
                Built for financial clarity. Simple. Monospace. De-complexed.
            </p>
        </footer>
    </main>
</body>
</html>`;
}

