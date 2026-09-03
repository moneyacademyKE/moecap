import type { ContentNode, SiteMetadata } from './assets';

export const METADATA: SiteMetadata = {
  title: 'Moe Capital',
  tagline: 'Market Insights & Wise Investing',
  bio: 'Hello, We are Moe Capital. We provide market insights, host the <a href="/nse" style="color: var(--link); font-weight: bold;">Nairobi Securities Exchange (NSE) ROIC Terminal</a>—a real-time interactive dashboard tracking return on invested capital (ROIC), multi-year financial statements, and efficiency metrics for 46 Kenyan listed companies—and help you invest wisely.',
  socials: [
    { platform: 'Twitter', url: 'https://twitter.com/MoneyAcademyKE', handle: '@MoneyAcademyKE' },
    { platform: 'Telegram', url: 'https://t.me/MoneyAcademyKE', handle: 'Telegram' },
    { platform: 'Substack', url: 'https://moneyacademy.substack.com/', handle: 'Substack' },
    { platform: 'Whatsapp', url: "https://wa.me/+25469000111?text=I'm%20interested%20in%20your%20whatsapp%20news%20updates", handle: 'Whatsapp' }
  ],
  substackFeed: {
    url: 'https://subs.moecapital.com',
    label: 'substack idea feed'
  },
  watchlist: {
    date: '3rd November 2025',
    stocks: ['Google', 'Cloudflare', 'Novo Nordisk'],
    description: 'As of 3rd November 2025 we have cashed out all our investment positions. We are focused on researching new opportunities for the new year. Stocks on our current watchlist include Google, Cloudflare and Novo Nordisk.'
  },
  historicalPicks: {
    date: '3rd June 2024',
    stocks: ['Mastercard', 'LVMH', 'Visa', 'Monster Beverage'],
    description: 'We had previously championed the stocks of Mastercard, LVMH, Visa, Monster Beverage as cornerstone US stocks due to their 25+% long term ROIC as of 3rd June 2024.'
  },
  partnershipTerms: {
    fee: 'Zero percent',
    hurdle: 'six percent',
    performanceAllocation: 'twenty five percent',
    description: 'We manage private investing accounts at a Zero percent management fee, a six percent hurdle rate, and twenty five percent of any return over hurdle (similar to the Buffett early partnerships).'
  },
  kolCampaign: {
    url: '/r',
    label: 'KOL campaigns'
  }
};

export const CONTENT: ContentNode[] = [
  {
    id: 'alice-interview',
    title: 'Alice Schroeder Interview',
    type: 'ARTICLE',
    category: 'INVESTING',
    content: `<p>This is probably the deepest and enlightening interview ever made about Warren Buffett. Please pay particular
			attention to parts 2–4 as they will have never before discussed topics regarding Warren Buffett. It’s best
			for those who have read or intend to read Warren’s authorised biography , The Snowball: Warren Buffett and
			the Business of Life book by Alice Schroeder.</p>

		<h2>Part 1: The Forging of a Skeptic- From Accountant to Buffett’s Voice on Wall St</h2>
		<p><span style="color:orange;"> Interviewer:</span> Hi Alice Schroeder. I would like to start by thanking you
			for taking the time to talk with me.</p>

		<p><span style="color:orange;"> Alice Schroeder:</span> Thanks for inviting me to do the interview. This is the
			first time I’ve ever talked to anyone at length about Warren Buffett Buffett, The Snowball, why I wrote the
			book, and the lessons learned.</p>

		<p><span style="color:orange;"> Interviewer:</span> Start by explaining what was special about your experience
			with The Snowball.</p>

		<p><span style="color:orange;"> Alice Schroeder:</span> When we discussed doing this interview, a theme that
			emerged was the hidden world of people like Warren Buffett Buffett, people who are in the top tenth of one
			percent of society in terms of fame, money, and connections, and how little most of us know of that world
			and its hierarchy and norms. Instinctively, you know that Snookie doesn’t go to parties with Bob Iger and
			Willow Bay (Disney CEO and his wife, a television host), but the more granular distinctions aren’t
			self-evident. For example, how valuable a form of social currency strong political connections in Washington
			can be, not because of their actual importance, but because they bring you reliably fresh and
			impressive-sounding conversational material to use at dinner parties.</p>

		<p>Even once inside a person’s world, getting to know their life history and psyche takes years, and that’s even
			more true of an important public figure because they’re so self-protective. Warren Buffett is so remote that
			his inner world has been accessible only to a tiny handful of people over the course of his lifetime, even
			though so many people are acquainted with him and consider him a friend. That makes it all the more unusual
			that he made himself world accessible to me and wanted me to write about him.</p>

		<p>He spent a huge amount, I’ve estimated 2,000 hours, of concentrated time with me, and through this direct
			experience, I gleaned impressions of him. These could be compared to his own self-perception, to the
			impressions of hundreds of other people whom I interviewed, and to the documented history of his life as
			contained in his papers and letters and photographs from more than 70 years of collected material.</p>

		<p>Nobody who has ever known him has had this 360-degree perspective. There are people who know more facts about
			him, but nobody else has a well-synthesized a view. I probably know him better than anyone, in this
			objective sense.</p>

		<p><span style="color:orange;"> Interviewer:</span> Let’s talk about your background. Give us a quick tour of
			your career from working as an auditor, regulator, insurance analyst, to working on the street and meeting
			Warren Buffett Buffett.</p>

		<p><span style="color:orange;"> Alice Schroeder:</span> I came to Wall Street as my third career. I started as
			an auditor working at Ernst &amp; Whinney, the predecessor to Ernst &amp; Young, in Houston, where I became
			a CPA. I then went to the firm’s national office in Cleveland, then to NYC. In total I was with E&amp;Y for
			11 years, auditing all sorts of companies, from defence contractors to banks. At headquarters, I had a
			variety of roles in the area of professional ethics, accounting standard-setting, and regulation. When Ernst
			&amp; Young merged, I was assigned to the merger transition team for about a year and a half.</p>

		<p>After I moved to New York to resume work as an auditor it didn’t take long to figure out that this was not
			what I wanted to be doing. I loved analysis, I’m very curious, and I wanted to understand the big picture
			and write about it for others. At the time my former boss and mentor, Denny Beresford, was Chairman of the
			FASB (Financial Accounting Standards Board, the standard-setter for the U.S. Generally Accepted Accounting
			Principles). He knew I was considering leaving Ernst &amp; Young and suggested that I come work for the
			FASB. I took that job thinking that it would be intellectually challenging, analytical, and involve plenty
			of speaking and writing.</p>

		<p>At the FASB, I was assigned, essentially by being next in line as the most recent arrival there, to a dreaded
			project, which was to oversee the issuance of some of the most important new accounting regulations for U.S.
			insurers in 20 or so years.</p>

		<p>Nobody on the staff wanted to work on these. The insurance industry had been fighting ferociously for more
			than a decade to keep them from getting passed, and with a lot of success. Insurance accounting is so arcane
			that insurers can usually fend off regulators and law enforcement people without too much trouble by
			throwing up a cloud of impenetrable jargon. People at the FASB enjoy mastering narrow subjects, but they
			don’t want to make a career out of any one thing, and this project was like quicksand that had nearly
			swallowed a couple of people.</p>

		<p>There’s a saying on Wall Street that you either have the insurance gene or you don’t. It’s an interesting
			industry for investors because it requires a lot of probabilistic thinking. If you look at the landscape of
			investing you’ll see that many distinguished investors have an affinity for insurance, chief among them, of
			course, Warren Buffett Buffett. I got assigned to this project by chance, but I fell in love with the
			industry within a couple of weeks.</p>

		<p>The main topic was SFAS 113, Accounting and Reporting for Reinsurance of Short-Duration and Long-Duration
			Contracts; I also went on to complete EITF 93–6, Accounting for Multiple-Year Retrospectively Rated
			Contracts; and, EITF 93–14, Accounting for Multiple-Year Retrospectively Rated Insurance Contracts by
			Insurance Enterprises and Other Enterprises.</p>

		<p>Their titles are a mouthful, but essentially, they all eliminate deceptive accounting practices in which
			reinsurance contracts were created specifically not to indemnify risk, but to shuffle or smooth earnings
			around from one accounting period to another?—?or artificially inflate an insurance company’s reported
			capital reserve one way or another.</p>

		<p>If these rules passed, some companies and segments of the reinsurance industry would be losing their most
			profitable products, at least on a risk-adjusted basis. Conceptually, these deals were a very effective form
			of leveraging capital at very low, and even no, risk. They were very similar to the type of securitizations
			that got Enron in trouble. Not surprisingly, Wall Street also was starting to dabble in the business.</p>

		<p>I was determined to get it done. This project had languished long enough, and I didn’t want to make a career
			out of writing these rules. As part of this process, I oversaw several public hearings that you could fairly
			call contentious. We got the whole thing finished in eighteen months. Denny Beresford, my research director
			Tim Lucas, and one board member, in particular, Jim Leisenring, were courageous in helping me fight off a
			wave of industry obfuscation and denial.</p>

		<p>Toward the end, as the outcomes became clear, some in the insurance industry flipped and started recruiting
			me. Their ostensible goal was to enlist my expertise, but really, they wanted to me help them find ways
			around the rules I had just written. That wasn’t very appealing. Meanwhile, I recall someone at the FASB
			observing, “You’re great at interpreting complex ideas for a hostile audience,” and Karen Rubsam, who later
			became CFO of Zurich Re, suggested I consider becoming an analyst.</p>

		<p>Having fallen in love with the industry, I went to Wall Street to cover insurance companies and ended up at a
			small boutique investment bank that is now known as Dowling Partners. They were a maverick firm that took
			delight in tipping over sacred cows. They were also technically sophisticated and wanted someone with an
			accounting background.</p>

		<p>V.J. Dowling, who ran the firm, was and is brilliant. He viewed the industry as a vast minefield of deceit
			that could be navigated by sleuthing and in-depth analysis. He was incredibly competitive. His attitude was
			you must be first to reveal market-moving information?—?or it’s worthless. It was a great foundation to
			start with.</p>

		<p>Eventually, Dowling relocated from Boston to Hartford, CT. That became a logistical catalyst for my move to a
			New York securities firm. I joined Oppenheimer in 1994 and it became one of the highlights of my career. I
			was fortunate to make partner and managing director quickly?—?and made the Institutional Investor
			All-America Research Team within two years. Oppie was a vibrant place to work that brought out the best in
			me. I had some brilliant colleagues, including Steve Eisman (FrontPoint partners, as described in Michael
			Lewis’ The Big Short) and Meredith Whitney, back when she was a wide-eyed research assistant who worked for
			Steve.</p>

		<p><span style="color:orange;"> Interviewer:</span> I apologize for interrupting, but you mentioned some amazing
			situations and people. I find it interesting how certain settings can forge traits. In this case, you,
			Meredith Whitney, and Steve Eisman all shared office space. Were there any characteristics that your
			co-workers that led them to future greatness?</p>

		<p><span style="color:orange;"> Alice Schroeder:</span> “Greatness” is a flattering term. What I will say is
			that Meredith, Steve, and I tend to be among the sceptics. Oppenheimer attracted and supported sceptics.</p>

		<p><span style="color:orange;"> Interviewer:</span> What fostered this scepticism?</p>

		<p><span style="color:orange;"> Alice Schroeder:</span> Oppenheimer did not do much banking. It was a 2nd, if
			not 3rd tier firm on league tables. The only way clients would pay attention to Oppie analysts was if we
			added real insight and made a lot of noise about it. One way to do this was by following small caps. Another
			way was by being contrarian and accurate?—?the person who did not buy baloney dealt out by management.
			Unlike many firms, Oppenheimer supported you if you did that.</p>

		<p><span style="color:orange;"> Interviewer:</span> This reminds me of James Grant indicating a great way to
			make a name is to follow unpopular paths and recommend shorts.</p>

		<p><span style="color:orange;"> Alice Schroeder:</span> In a normal market, it is tough to be the naysayer, but
			the past few years have been a heyday for short-sellers. With so much hedged money, there’s also far more
			demand for diverse opinions today. In general, though, the human race is biased towards the positive. You
			have to be optimistic to go through life.</p>

		<p>There’s also some interesting research that shows that people who speak out critically are viewed as smarter
			than those who give only uncritical applause, even though they are less liked. In the long run, the price of
			popularity is paid in respect.</p>

		<p><span style="color:orange;"> Interviewer:</span> Two things I wanted to go back to; first your experience as
			a regulator and how this taught you how games are played; and second, you mention the importance of being
			sceptical. Is this an inborn trait or can analysts, investors, and others develop this trait (if so how)?
		</p>

		<p><span style="color:orange;"> Alice Schroeder:</span> We may have a natural bent one way or another, but it is
			very strongly shaped by experience. As just one small example, when I worked on the E&amp;Y transition team,
			it was fascinating to see first-hand the amount of friction, wasted time, and lost energy that inevitably
			occurs in a merger integration. And this was quite a successful merger. So, you can imagine how sceptical
			the experience made me of projected “acquisition synergies” in deals I later covered or took part in on Wall
			Street.</p>

		<p>My experience in regulation was also immensely useful in this respect. It exposed me to dozens of people
			lobbying for an outcome. This is a side of human behaviour that we see much less often as an analyst or
			investor. Try as they might, people aren’t putting their best foot forward when they’re lobbying you;
			they’re putting their greedy foot forward. Also?—?and I have never said this before in an interview?—?being
			in the presence of a blonde has an interesting effect on some people. It can get tedious to be
			underestimated but has its advantages. Certainly, it raises one’s scepticism.</p>

		<p><span style="color:orange;"> Interviewer:</span> So on to the question about scepticism. Being underestimated
			resulted in developing a different perspective. How can we make sure that we have a healthy amount of
			scepticism? In other words, how do you recommend developing skills for detecting charm versus substance?</p>

		<p><span style="color:orange;"> Alice Schroeder:</span> I think it’s one of the hardest things in the world to
			do. I’ve definitely made my share of mistakes that taught me a few things, and there’s always more to learn.
		</p>

		<p>You have to separate charm, meaning impression management skills, from the substance of what a person
			actually accomplishes. The personality, friendliness, and impressiveness of the person can be positively or
			negatively correlated with the results they are producing. Psychopaths and con artists are notoriously good
			at manipulating impressions.</p>

		<p>Paul Babiak’s book, Snakes in Suits, is a terrific primer on how to recognize a psychopath in a business
			context. With practice, you don’t have to do business with someone directly to evaluate whether they’re
			trustworthy.</p>

		<p>Working as an auditor was helpful. Auditors have their faults and obviously were implicated in a lot of
			accounting failures in the past decade. Still, as an auditor, you are trained to look for discrepancies and
			assume they may be important. You aren’t supposed to ignore little aberrations, however seemingly minor,
			just because someone has a reasonable-sounding explanation to rationalize them away. In financial markets,
			companies use this psychological vulnerability against investors all the time.</p>

		<p>People who are psychologically and financially invested in a stock work very hard to resolve any newly arisen
			cognitive dissonance in favour of their vested interests. Cialdini speaks of the Commitment and Consistency
			principal and psychologists speak of confirmation bias. The auditing profession is built on the foundation
			of fighting that bias; small discrepancies must never be dismissed; they must be investigated. Whether in
			journalism, writing, or finance, that’s an invaluable lesson.</p>

		<p>There’s another thing. Many exceptionally good business people are charismatic –- but not charming. Charisma
			is the ability to attract people to you and to convince them you are exceptional, even if you aren’t
			likeable. The Gordon Gekko’s of the world.</p>

		<p>Charisma can interfere with your ability to override what Cialdini calls the “click-whirr” reaction, your
			evolutionary response to persuasive stimuli. You can trick yourself into believing you’re objective about
			someone you don’t find particularly charming when in fact you’re falling for their charisma. Predatory
			people on Wall Street and business often base their careers on the “click-whirr” reaction.</p>

		<p>My own rule of thumb: watch what they do, not what they say. If someone’s behaviour deviates from what they
			are telling you, always go with the behaviour. This means sometimes you’ve got to override your gut, which
			like all instincts is driven by evolutionary biology. I’m a strong believer in listening to intuition, but
			only after its checked against reality. “Blink” is not a smart way to invest.</p>

		<p>An example is American International Group. Like many analysts, I recommended that stock for a long time, too
			long, even though it in many ways was a tremendous black box, primarily justified on the basis of it
			employing the smartest people in the industry in which it competed. I ended up being one of the first people
			to downgrade AIG when I was at Morgan Stanley, and my observations were extremely basic. Historically, AIG
			had announced the date on which they would release earnings on a certain schedule every quarter. It had
			never varied.</p>

		<p>Early in 2003, at the end of a bad insurance cycle when a lot of similar companies had taken reserve charges,
			the day arrived and AIG didn’t announce their earnings release date. That was out of the pattern, and I
			thought it had to mean something bad was brewing. We suspected this had to do with pressures from the
			economy that were affecting their business, so that’s what we said in the downgrade. Next thing you know,
			AIG reported a $2.8 billion reserve charge. If the business had been better and they’d had a tailwind, they
			might never have taken this charge. They probably would have bled it into earnings and covered it up. And
			Eliot Spitzer forced Hank Greenberg out over this charge. That was the beginning of the landslide for AIG.
		</p>

		<p><span style="color:orange;"> Interviewer:</span> You talk about Cialdini and mention the importance of
			looking for congruence. Is there any material besides Cialdini’s Influence which you find useful in becoming
			a better auditor?</p>

		<p><span style="color:orange;"> Alice Schroeder:</span> Yes, I will give away some of my secrets. People would
			do well to study investigative journalism. Read something like Den of Thieves or A Civil Action and try to
			reverse engineer how it was reported.</p>

		<p>Here are three other great books on conversing with people, understanding their real motives, and just
			generally understanding how the human mind works.</p>

		<h2>Part 2: A Behind the Scenes Look at Wall St Morgan Stanley</h2>

		<p><span style="color:orange;"> Interviewer:</span> Can you comment (without stepping on anyone’s toes) on the
			experience of being an analyst at Morgan Stanley? Take us behind the scenes of coming up with an idea,
			monitoring a company, and issuing a rating.</p>

		<p><span style="color:orange;"> Alice Schroeder:</span> Oh, I’ll comment freely. When I left, I did not sign a
			separation agreement. It would have required me to get written permission to speak or write about Morgan
			Stanley and would have subjected me to liability if I said anything that they, by their unspecified
			definition, considered criticism.</p>

		<p>I would have been paid much more for agreeing to this, but I didn’t want to be muzzled.</p>

		<p>So, what is it like to be an analyst…When I started at Oppie it was very free form. Analysts used their
			judgment. Over time, as I moved through the different firms, especially Morgan Stanley, more and more
			requirements arose. There were things you had to write every time you published on a company. The financial
			models became standardized. Like any other business, the more you standardize something, the more you stamp
			out creativity.</p>

		<p>This was more than just compliance. Through this process, big firms like Morgan Stanley were also trying to
			brand themselves. The firm wanted to be the brand and discouraged its analysts from doing distinctive enough
			work to result in them becoming a brand themselves.</p>

		<p>You may wonder why analysts at banks hedge themselves so much?—?on the one hand, this, on the other hand,
			that. Partly it can be lack of courage. But someone is always trying to lawsuit-proof your opinion. Decisive
			statements are lawyered into “may, can, could, might, potentially, appears” instead of “is, does, should,
			will,” much less “look out below.”</p>

		<p>The time pressures that work against quality research are also well-known. You write up a lot of
			inconsequential things, especially what I call “elevator notes” (this quarter “X was up and Y was down”).
			Instead of writing original or probing views, you are really incentivized to spend as much time as possible
			marketing.</p>

		<p>Also, if you adhere to consensus, it does protect your career. There’s an old saying that no one ever got
			fired for buying from IBM. Nobody ever got fired for making a wrong estimate that was within the sell-side
			consensus.</p>

		<p>Whereas, if you break from consensus, you really can’t afford to be wrong very often. That phenomenon really
			drives the sell side. It can be overt, such as when we were judged on how “commercial” our work was. This is
			a veiled threat, because, of course, our work has to be marketable in order for us to have a job. The firms
			essentially want two things that are incompatible. They really do want you to do no consensus work that’s
			attention-getting enough to be of interest to clients, but it also has to be right to be commercial, or you
			are punished. The fear of punishment nearly always beats the desire for reward, so this creates constant
			pressure to pull in your elbows.</p>

		<p>Finally, of course, there’s the well-known banking conflict of interest. My team had its encounters,
			especially over Aon, at the time a disaster of a stock. Once, we were told “Pat Ryan [then CEO of Aon] is
			reading your reports, and he’s not happy,” as if our job was to make Pat Ryan happy. Aon was so beaten down
			that it always looked cheap. It repeatedly head-faked investors. Management would claim victory on a
			turnaround, then it would blow up again. Our refusal to recommended Aon no matter how cheap it got
			frequently put us in opposition to Gary Parr, the banker, who was a fierce advocate for his client. The day
			Gary left Morgan Stanley, we literally gathered in the hallway and celebrated.</p>

		<p>With that said, ultimately Morgan Stanley backed me up. It backed me up on many occasions. My research
			director, Mike Blumstein, was very supportive. A number of bankers were supportive. On one memorable
			occasion, Joe Perella intervened directly with a banker after I talked to him about a proposed GE deal. He
			killed the deal, which probably saved us a huge lawsuit.</p>

		<p>From what I understand, pressure still exists. For one thing, if there’s a layoff, analysts who are needed
			and liked by bankers are protected. The 20% of the department that is getting fired will be chosen from the
			rest. You can do the math on that.</p>

		<p><span style="color:orange;"> Interviewer:</span> You jumped in front of my next question. I didn’t realize
			the pressure you faced on the sell side. Are there any firms that you recommend as staying true to their
			research and escaping the perils of groupthink?</p>

		<p><span style="color:orange;"> Alice Schroeder:</span> Boutique investment banks and broker-dealers by
			definition are better if you are looking for stock picking advice. In effect, they’re performing a different
			service than a large bank. They don’t send their analysts on constant marketing trips to discuss their
			sectors and the banking work is distributed among more people. They’re more heavily staffed for research in
			general, and usually, commit all their resources to one or two industries. They follow small caps. The risk
			you have with boutiques is their dependence on access to management and industry sources. They’re like
			journalists who follow a beat –- they live and die by their sources.</p>

		<p>In terms of groupthink, first, its part of human nature. There’s a lot of research that shows this, such as
			the famous Milgram experiment. Let’s translate this to a stock. If a company is obviously broken but no one
			else is saying that, then an analyst who thinks so will begin to question his or her judgment when the
			market continues to disagree. Another way to put this is to say that bystander apathy is powerful on Wall
			Street. Bystander apathy is the famous psychological propensity of people to ignore disasters happening
			right in front of them when they’re in a crowd if no one has made the first move. Analysts think, “Who am I
			to try to rescue investors from impending disaster. I’m no smarter than these other 18 people covering this
			company.”</p>

		<p>You have to have enough of an ego to believe you’re smarter, and, this will sound corny, but it helps
			enormously if you have crusader streak. Crusaders will suffer all kinds of slings and arrows in the name of
			whatever they believe is justice. That’s how you become a Steve Eisman.</p>

		<p>People who gravitate to short-selling also innately have this personality. It’s kind of interesting that some
			of them now have almost cult-like followers. In recent years, we’ve been living in a time when being a
			crusader and being negative is handsomely rewarded and respected. A decade ago, that certainly wasn’t true.
			Someday the pendulum will swing back.</p>

		<p><span style="color:orange;"> Interviewer:</span> How did this pressure play into the short-sighted nature of
			company guidance and quarterly estimates?</p>

		<p><span style="color:orange;"> Alice Schroeder:</span> You know, I don’t see that being linked to the time
			pressure of sell-side analyst work as much as the fundamentally short-term nature of investors’ quickened
			expectations. If you’re a hedge fund manager who’s being judged, not just quarterly but monthly, weekly, and
			even daily, then every minute matters. The brokerage firms all have at most 1-year rating systems. And,
			often you are judged in shorter increments than that for your stock picking.</p>

		<p>The rating systems are a major criticism I have of Wall Street research. When the firms began to judge
			analysts for things other than their banking skills and client popularity, they migrated to stock-picking.
			Now, there’s a big difference between stock-picking that is, continuously making predictions about exactly
			which companies in a particular group will do the best over the next few months and investing, which is a
			profession in which it pays to realize most of the time you don’t have a good answer to that question.</p>

		<p>One of the several reasons I left the Street is that I was tired of being a short-term market prognosticator.
			Almost by definition, that’s a silly thing to do.</p>

		<p><span style="color:orange;"> Interviewer:</span> From what you tell me, what I hear is that they
			(short-sighted analysts) are not thinking like owners.</p>

		<p><span style="color:orange;"> Alice Schroeder:</span> They don’t have the luxury of thinking like owners.
			Neither the buy side or sell side, with the exception of a handful of value managers, the majority of whom
			continue to manage relatively smaller funds by Wall Street standards.</p>

		<p><span style="color:orange;"> Interviewer:</span> So, let’s bring Warren Buffett Buffett into the picture.
			You’re an analyst covering insurance companies. When is the first time you come across Berkshire Hathaway?
			Do you still remember the day you released the Paine Webber report?</p>

		<p><span style="color:orange;"> Alice Schroeder:</span> Oh yes. I came across Buffett when Berkshire bought the
			second part of GEICO, which was a major event. It never occurred to me to begin following it until several
			years later, when Buffett announced his bid for General Re. At that point, a number of my clients asked me
			to follow Berkshire Hathaway. They were going to own the stock and they wanted research coverage.</p>

		<p>These clients knew I liked complex difficult things to analyse. That I was interested in doing things that
			were different even if there was no obvious commensurate reward for the extra effort. The sell-side had
			limited interested in following Berkshire, to say the least. The stock didn’t trade. At the time, Warren
			Buffett essentially didn’t pay bankers and frequently expressed a negative attitude toward the Street.</p>

		<p>So, I went to my research director at PaineWebber and made a case that our retail brokers would appreciate
			this coverage because their clients were interested in Berkshire and Warren Buffett Buffett. Being able to
			call and talk about Berkshire was a service for retail clients that did not involve asking for a
			transaction. It was something their financial advisors appreciated being able to offer. To its credit,
			PaineWebber gave me a thumb up.</p>

		<p><span style="color:orange;"> Interviewer:</span> What was the next step? Did your director just say ‘go for
			it’? What was it like discovering Berkshire Hathaway?</p>

		<p><span style="color:orange;"> Alice Schroeder:</span> Warren Buffett always said he revealed everything
			investors needed to know from his financial statements, but that was not the perspective of many analysts. I
			find it interesting that Buffett has criticized Wall Street for being over-dependent on private information
			from management. When I started taking Berkshire’s public disclosures and merging them with my earnings
			model on General Re, I quickly learned what so many people already knew, which is that investors had been
			struggling for years trying to value Berkshire. I ultimately based my valuation on three things: insurance,
			the group of other little businesses, and the publicly traded investment portfolio. I just started putting
			it together. There really was not a lot of information to do a detailed valuation and frankly, there is
			still a lot of ambiguity. But I assumed that anything would be value-added to investors versus what they
			had, and that turned out to be right.</p>

		<p>As an aside, at the time and continuing to this day, its not uncommon for money managers who are vocal
			champions of Berkshires attractiveness as an investment in public to take me aside in private and wring
			their hands over the problem of how you value Berkshire stock, and whether it is over- or under- or fairly
			valued.</p>

		<p>People get stuck in this position because they trust Warren Buffett philosophically, and they believe the
			empirical track record, yet, for lack of information, they’re prevented from living up to the professional
			standards of analysis that they apply to their other investments and that Warren Buffett applies to his own
			investments. As security analysts, this makes them uncomfortable.</p>

		<p>Warren Buffett has always had the attitude that investors should trust him enough to let him operate in
			privacy. People were fine with that for a long time and were rewarded for their trust. As has gotten older,
			they’re less fine with it, which is reasonable.</p>

		<p>For Part 3: Alice Schroeder Describers Her Experiences with Buffett</p>

		<h2 id="part-3-meeting-the-oracle-of-omaha" id="part-3-meeting-the-oracle-of-omaha">Part 3: Meeting The Oracle
			of Omaha</h2>

		<p><span style="color:orange;"> Interviewer:</span> At what point (and I don’t know if this happened or not) do
			you say there is more to this guy (Warren Buffett) than meets the eye? Did you just write the (BRK
			Initiating Coverage) report and never expected things to progress (into a book deal)?</p>

		<p><span style="color:orange;"> Alice Schroeder:</span> You can tell he’s not ordinary by reading anything he’s
			ever written. I knew right away he was a legend. It was also apparent at our first meeting how different he
			was. I took a list of 60-some-odd questions that should have filled several hours of conversation. We sat on
			his Gulfstream flying to Omaha and he sliced through those questions in about 45 minutes in between
			mouthfuls of potato chips. I had to improvise, which was terrifying at the time. It was my first encounter
			with what conversing with him was like.</p>

		<p>But, to go back to exactly how I met him: Shortly after I started working on the report, clients who wanted
			to meet Buffett asked me to get a meeting with him. The ostensible reason was that they were going to be
			voting on the General Re merger and their fiduciary obligations as fund managers required them to meet with
			the management of any company whose stock they owned. Truthfully, I’m not sure how eager they would have
			been to fly to Omaha to meet anyone but Warren Buffett Buffett.</p>

		<p>So, I wrote him a letter saying that shareholders representing 13% of General Re’s stock wanted to meet with
			him and we were all willing to fly to Omaha if he would give us an hour of his time.</p>

		<p>I thought it was a long-shot. But Warren Buffett called me within a couple of days on the phone. That was my
			first encounter, and, as are many people who don’t know him at first, I was shocked that he answered his own
			phone and dialled his own outbound calls. I thought it was a prank until after the first sentence or two
			when I was sure from the voice that it was him. Then my knees were shaking.</p>

		<p>He said, “Come on out.” So, we went. In the end, he gave us about two hours. The conversation would seem
			surreal to a lot of people because we literally spent almost two hours talking about insurance. It really is
			the insurance gene thing. And, I was with exceptional investors like Jody Jonsson from Capital Group and
			Chris Davis. Warren Buffett enjoyed it because he loves to talk about insurance.</p>

		<p>Three weeks later, I was in my office, never expecting to hear from Warren Buffett or talk to him again. My
			phone rang. It was him. Hearing his voice, with no secretary placing the call, was again shocking. He got
			straight to the point.</p>

		<p>He said (and I’m paraphrasing), “I never have had any contact with the Street, but Berkshire is now very
			complicated. Someone needs to teach investors how it works. This means I have to choose between the lesser
			of 2 evils. Either I give one person an advantage over their peers. Or, I have to be bothered all the time
			by analysts. I don’t want a gaggle of analysts calling me all the time, so I am choosing to give one person
			an advantage. Would you do me a favour and be that person?”</p>

		<p>With hindsight, this elegant way of reasoning and drawing me in was so classically Warren Buffett. It made a
			strong impression on me at the time. When you ask how I knew he was different, it was from episodes like
			this. And, perhaps as he wanted, I felt that he chose me. I had shown the initiative to cover the stock and
			had brought people to Omaha, and he really likes it when people come to Omaha. It matters to him more than
			people realize. So, I said, “Of course, I would be thrilled to,” and that was the beginning.</p>

		<p>By the way, there has sometimes been a misunderstanding that he asked me to cover the stock. There is no way
			he has ever asked anyone to cover the stock. It’s unthinkable. He rarely asks anyone outright for anything.
			He wanted to talk to me because I was already going to do it.</p>

		<p>So, after that, I would fly to Omaha and interview him once or twice a year and talk to him by phone
			periodically. My first interview was that conversation on a NetJets plane in 1998, flying to Omaha with him
			and Susie.</p>

		<p>Susie sat in the back of the plane and read magazines the whole time. She was obviously irritated at him.
			This side of Susie came out very, very rarely, but if she saw Warren Buffett showing off in front of a
			woman, that could trigger it. And Susie dealt with it fabulously, very gracefully, letting him know in
			multiple nonverbal ways that he was irritating her. Susie was an unusual person whose emotional intelligence
			was off the charts.</p>

		<p><span style="color:orange;"> Interviewer:</span> What was it like being the world expert on Berkshire
			Hathaway?</p>

		<p><span style="color:orange;"> Alice Schroeder:</span> I thought that it would be interesting to our retail
			brokers and to a limited number of institutional investors. I knew that a lot of people on Wall Street were
			indifferent to Warren Buffett Buffett and some even disliked him for one reason or another.</p>

		<p>What I didn’t expect was that the new role would become huge, but it did, because, until that time, Warren
			Buffett had been so inaccessible. The New York Times ran a front-page business section story “The Oracle of
			Omaha Taps a Medium on Wall Street.” For a while, I had 3 people answering the phones. I can’t tell you how
			many phone calls just never got returned; it was like a wildfire. Thankfully, it calmed down after a few
			weeks.</p>

		<p>Berkshire was a very interesting stock to follow, especially as you began to really understand it and its
			most important elements. Shortly after I began my new role, Warren Buffett made a series of acquisitions in
			the late 1990’s and early 2000’s. There was, as there still is, a fascination with the minutiae of these
			companies. But it seemed to me that the most important part of what he did resembled a factory-like process.
			What interested me was the factory.</p>

		<p><span style="color:orange;"> Interviewer:</span> When does the Snowball come into the picture?</p>

		<p><span style="color:orange;"> Alice Schroeder:</span> In 2003 I had been following Berkshire for 5 years. I
			had been an analyst for 10 years, and the job was getting a lot less fun during the Spitzer era. I was
			thinking about starting a boutique research firm. I was talking within Morgan Stanley about moving into
			management. I was also contemplating doing something completely different.</p>

		<p>There were two threads that merged. One was that an author contacted me with an idea for a book about
			Buffett. I didn’t love this author’s particular idea, but it got me thinking more about the subject of what
			books should be written about him. There were so many books trying to describe how Buffett invests, but
			there was nothing, really, that combined his management and business philosophy with a fairly comprehensive
			account of his own biographical information. There was no “biography of ideas.” I wasn’t really thinking
			about writing a book; I called him and told him about this book suggestion and said I thought he should
			write it.</p>

		<p>Warren Buffett replied that he liked the idea but that he would never write a book and asked me who else I
			thought could do it. I said Carol Loomis, and he said Carol is not going to do it. He asked me again, “Who
			else do you think could do it?”</p>

		<p>Then comes the second thread, but the only retrospect did it make sense. Warren Buffett, ever since 9/11, had
			periodically mentioned that he liked the way I wrote and thought I should quit my job and write a book. I
			realize now that this started right after the death of Katherine Graham. Warren Buffett viewed Personal
			History as a seminal episode because it defined her in the public’s mind. When Kay died it brought him to
			the conclusion that the subject has to get on with it if such a book is to be written. But I found this out
			from conversations with him later. He never mentioned Personal History to me at the time. So, I would say,
			“But Warren Buffett, what should I write about?” at which point he would say, “oh, you’ll think of
			something.” I assumed he meant something about insurance or Wall Street. Unsurprisingly, nothing compelling
			came to mind, so I wasn’t going to quit my job to write a book.</p>

		<p>Now, when he put me on the spot in this conversation, it was clear that absent him or Carol, nobody would
			write this book that I had conceived of but me, and that’s what he was saying. Once I understood the offer,
			I knew The Snowball was worth doing. The magnitude of writing a book like that was overwhelming, though. It
			still didn’t occur to me to shelve my other plans right then and there to write a book like this. I said
			something to Warren Buffett about how maybe I could do it in 10 years or so when I retired.</p>

		<p>I wasn’t worried about the timing because, just as with my report on Berkshire, it never occurred to me that
			I would have any direct help from him. That may sound odd because a lot of people would have seen the
			advantage of getting his cooperation and would’ve asked for it.</p>

		<p>But one of the criteria of getting along with Warren Buffett, of him seeking out a relationship with you, is
			that you don’t have expectations. People who ask him for things, even small things, do not get to stick
			around long. Over and over, I’ve seen that only a person who genuinely has no expectations gets offered
			things by him. At the time I had no inkling of this, so I wasn’t expecting it when Warren Buffett instantly
			said, “Well, I’ll cooperate with you if you write the book. I’ll do interviews with you; I’ll give you my
			files, etc.”</p>

		<p>That changed everything. It meant I would have to start right away. (At the time he was 73.)</p>

		<p>It was an incredible offer, but even so, I had to think about it. It was a big risk. I had never done
			anything like this before, and I could fail. I was giving up my career. Financially, though this still
			surprises some people to hear, I would be giving up a job on Wall Street that was far more lucrative and
			financially stable than even the best of book contracts. But, most frighteningly, it was a huge
			responsibility, and it was an irrevocable one. I was being entrusted to produce the book that would define
			Buffett and would always bear the responsibility for interpreting the knowledge I was given.</p>

		<p>Yet I was really excited about to spend all this time learning from him. (I later realized that the kind of
			attention I received was something even some of his close business partners, family, and friends were rarely
			given.) I felt that the world needed this book, and it could be a great gift to do this for people. I like
			challenges. I would learn new skills: writing narrative, interviewing, and structuring the story. No one
			else ever had or ever would have this opportunity. How could you turn it down? So, I called him back two
			days later and said, let’s go. In June 2003, I flew out there and we started.</p>

		<p><span style="color:orange;"> Interviewer:</span> So, you decide to write the book, what’s next? Did you quit
			your job? How did you juggle multiple responsibilities?</p>

		<p><span style="color:orange;"> Alice Schroeder:</span> Originally, I thought I could do this on a part-time
			basis and at least stay with Morgan Stanley and write occasionally as a strategist if I gave up my stock
			responsibilities. That was naive. I ended up becoming what’s called an Advisory Director, which is somewhat
			like going limited at Goldman.</p>

		<p>I had some minor responsibilities at Morgan Stanley while writing the book but spent close to full-time
			writing.</p>

		<p><span style="color:orange;"> Interviewer:</span> At that point, what was the message of the book? How were
			you going to tell Warren Buffett’s story?</p>

		<p><span style="color:orange;"> Alice Schroeder:</span> Initially, it was still this notion of the biography of
			ideas. Warren Buffett kept referencing Iacocca’s biography and Kay Graham’s. He loved Iacocca’s book and, in
			fact, started shovelling biographical material at me immediately. There were a lot of stories he had been
			saving for “the” book. Some of the material was very personal and revealing, including the mental illness in
			his family and his shoplifting as a child. Sources who had never spoken to anyone came forward because this
			was “the” book. Warren Buffett said he wanted to reconcile his public and private selves. It was the right
			thing to do, revealing the source (and wellspring) that forged Buffett.</p>

		<p>He was very clear from the very beginning that he did not want any editorial involvement. That it was my
			book. He did not want to have any control and he wanted me to write whatever was best in my judgment. He
			explicitly said as I wrote in the first few pages of The Snowball, “Use the less flattering version’’ if his
			version differed from anyone else’s.</p>

		<p>Warren Buffett wanted a successful book that would be credible enough to sell well. In a sense, he also
			didn’t trust himself to write it. I have an interesting interview recorded with him insisting that I will do
			a better job of the book than he would.</p>

		<p>He also knew if he got involved, a publisher might market the book as if he were the co-author or as if it
			were ghost-written, and he wanted the boundary very clear that it was not his book.</p>

		<p><span style="color:orange;"> Interviewer:</span> As you are writing the book, does anyone stop you along the
			way? Was there any fear involved in the process?</p>

		<p><span style="color:orange;"> Alice Schroeder:</span> There was constant fear from the first moment to the
			last. All different kinds of fear.</p>

		<p>Writing is all about fear.</p>

		<p><span style="color:orange;"> Interviewer:</span> What do you mean by that?</p>

		<p><span style="color:orange;"> Alice Schroeder:</span> Every word that you put on paper is an expression of
			your window on the world, of your abilities. It’s going to be judged and often judged harshly. In this case,
			it was a book that would be potentially historic. I was worried from the first day to the last as to whether
			I could live up to the responsibility I had been given. I was afraid of all kinds of other things. I was
			afraid of failure. I had to learn to write narrative and I was afraid of failing at that. I had to learn to
			interview like a journalist, which is a very difficult skill.</p>

		<p>There is another set of fears that go along with writing. You as an author have to confront yourself on the
			page. This doesn’t happen when you’re writing technical material, but when you venture away from that to
			draw judgments about people, all kinds of existential and psychological considerations emerge.</p>

		<p>The dynamic between the author and the subject is fraught with complication in every writing relationship.
			When the person on the other side of the table is Warren Buffett Buffett, there’s another kind of fear. I
			learned and observed very early in the project things that had happened to journalists who reported on him
			in a manner that bothered him. It’s an understatement to say that Warren Buffett is sensitive to criticism.
		</p>

		<p>When we started, I had no idea what he was really like, whereas he knows himself and his life story. A couple
			of people called me as soon as the book was announced and said things along the lines of “I know him really
			well and I didn’t think it could be done,” and “I couldn’t do it, but maybe you can pull it off.”</p>

		<p>Once I was far enough into the project to understand what they meant, it was too late to back out. I wasn’t
			particularly happy about being in this position. The path of least resistance would have been to write a
			Valentine book, but I just couldn’t do it. Instead, I convinced myself that he would be supportive of a
			truthful book. I told him, and my agent told him, any number of times, that there were parts of the book he
			wasn’t going to like, and he seemed fine with that and kept cooperating. Its pretty clear that to get the
			book done, we were both engaged in some magical thinking.</p>

		<p><span style="color:orange;"> Interviewer:</span> I had no idea how many things you went through both
			career-wise and then in writing this book. I don’t think most people appreciate how different you are from a
			traditional Wall Streeter (or even author).</p>

		<p><span style="color:orange;"> Alice Schroeder:</span> I’ve had some unusual experiences in my life that helped
			my judgment here. One example is from my career, during the E&amp;Y merger. I was one of the two people
			responsible for “independence” that is, rules that prevent auditors from having conflicts of interest with
			clients, such as investing in client stocks and having relatives employed by clients.</p>

		<p>The Ernst rules went beyond the minimum AICPA requirements, and we chose to continue that. I was involved in
			making decisions and giving people the news that they had to make awful choices. Their options were to quit
			their job or to sell a major investment in an illiquid limited partnership at a big loss, for example. Or to
			quit their job as a partner in Atlanta unless their sister, the CFO of some publicly-held client in Seattle,
			was willing to resign.</p>

		<p>These experiences taught me vivid lessons. Conflicts-of-interest-in-appearance and
			conflicts-of-interest-in-fact are two very different things. Inherently, conflicts-of-interest policies can
			only address appearances. And virtually 100% of the time, well-intended, ethical people are blind to
			conflicts when they’re faced with giving up some personal thing that they highly value.</p>

		<p>This happens to be one of Charlie Munger’s oldest points, though the implications I draw are slightly
			different than his.</p>

		<p>Rules are necessary because people are inherently human, not inherently evil. We can easily be way too
			black-and-white in our judgments of people who commit things that are labelled improprieties in hindsight.
			Nobody is all good or all bad. Well, almost nobody is all bad. My experiences made me firmer about applying
			principles, while at the same time, softer toward the people involved. For example, a relationship with
			Warren Buffett Buffett is extremely valuable. I don’t judge people for protecting it, I just feel freer for
			having been disentangled.</p>

		<p>Backtracking a bit, another advantage of starting as an auditor before Wall Street was that I had to spend a
			lot of time thinking, “Is this a good business or not? Is this company going to succeed or not? Is this a
			good industry or not?”</p>

		<p>I audited some truly awful companies. I couldn’t understand why anyone would want to be in these businesses.
			So, it came very naturally when I encountered Warren Buffett’s focus on the qualities of a good business.
		</p>

		<p><span style="color:orange;"> Interviewer:</span> It’s funny and I hope one day you can meet my boss. But you
			can tell him anything in the world (about an investment) but he always circles back to two questions</p>

		<p>Is it a good company, and
			Is it cheap?</p>

		<p><span style="color:orange;"> Alice Schroeder:</span> Sure.</p>

		<p><span style="color:orange;"> Interviewer:</span> I think that I am a little bit like you in that I love
			thinking about things. But I also find it very easy to get lost in details while forgetting to ask, “Is this
			something I even want to own in the first place?”</p>

		<p><span style="color:orange;"> Alice Schroeder:</span> One trap is not probing deep enough to really answer
			whether a particular investment opportunity is a good business. It’s easy to make a facile judgment about
			that based on a summary description of a business. The sheer breadth of different business and investment
			opportunities in a modern capital market creates an overflow of information that leads many investors to
			have short attention spans in thinking about companies comparatively. Curiosity is an inherent kind of
			arbitrage that no amount of computer technology can overcome. Warren Buffett makes it sound so simple to
			know what is and is not a truly good business?—?and great business do resonate very clearly when you
			understand why they are great and especially when they’ve been identified as successful investments by an
			investor like Warren Buffett Buffett and proven so with hindsight?—?but like many things in investing,
			Buffett makes it sound easier than it is. When it comes to appreciating something that is special about a
			business that others do not, I’ve learned that the devil really is in the details.</p>

		<h2 id="part-4-will-the-real-warren-buffett-buffett-please-stand-up"
			id="part-4-will-the-real-warren-buffett-buffett-please-stand-up">Part 4: Will The Real Warren Buffett
			Buffett Please Stand up</h2>

		<p><span style="color:orange;"> Interviewer:</span> Alice Schroeder, tell me about the process of getting to
			know Warren Buffett Buffett.</p>

		<p><span style="color:orange;"> Alice Schroeder:</span> I would ask him questions, and he was able to pull
			elaborate modules out of his memory bank. He has thought about so many things over the years that there are
			polished nuggets prepared to respond to almost any question. At times, it was hard to get him to give
			spontaneous answers –- or to give on-point answers to questions he hadn’t been asked before.</p>

		<p>As you get to know someone over time by spending days on end with them sitting in their office watching them,
			you begin to see the real person. I got to know him and understand his mind in business and investing by
			writing The Snowball. I saw him interacting with his family, his friends, managers, his office staff, and of
			course, myself. I saw him in all kinds of moods.</p>

		<p>It was eye-opening to watch Warren Buffett dealing with celebrities. He’s expert at it, yet occasionally some
			weird thing happens. There was one funny episode, for example, when he invited Sophia Loren to the
			shareholder meeting as a celebrity guest. He was surprised, and a little insulted when she wanted to be paid
			to attend. I mean, in his mind, who wouldn’t want to attend his shareholder meeting? So, throughout all of
			these interactions, I saw the different aspects of his personality emerge.</p>

		<p><span style="color:orange;"> Interviewer:</span> Could you shed some light on Buffett’s daily life? What is
			his daily routine? Maybe you could comment on his interactions with the management teams.</p>

		<p><span style="color:orange;"> Alice Schroeder:</span> Sure. He comes in the morning and his routine is to
			switch on CNBC with the sound muted and start reading while glancing at the crawl from time to time. The
			wooden shutters on the windows are always closed. You get no sense that a world exists outside, which is
			what he wants, no distractions. As far as I can tell, he doesn’t need sunlight.</p>

		<p>He is already pretty well versed in the news by the time he gets in, through the Internet and television. But
			he still prefers newspapers. He reads the WSJ, NYT, Financial Times, Washington Post, the Omaha
			World-Herald. He reads some offbeat things like the NY Observer. He reads all sorts of trade press relating
			to the different businesses that Berkshire runs. American Banker, Oil &amp; Gas Journal, A.M. Best,
			Furniture Today. There are stacks of reports from the different BRK subsidiary companies on his desk.
			Throughout his day he grazes through the reading pile.</p>

		<p>Meanwhile, he talks on the phone. He doesn’t make a lot of outgoing calls; people call him. That’s his day …
			most of the time.</p>

		<p>People do come to visit him and he’ll sit and spend an hour with someone or have lunch or dinner. A lot of
			days he doesn’t have anything on his schedule. His interaction with managers is minimal. Some of them call
			him regularly, but he’s not kidding when he says that others, he speaks to maybe a couple of times a year,
			or they communicate in writing. He responds if they call him. He almost never calls them. If they call him
			he’ll be very agreeable and talk but he keeps the conversation quite short. When they do call, he acts as a
			sounding board. The one thing he controls is capital decisions. But anything else, it’s pretty much up to
			them.</p>

		<p>He is a very good listener who gives excellent advice, and he’s also pretty firm about not giving unasked
			advice. The managers vary in their desire (for asking for advice). The ones that do ask use words like
			“invaluable” to describe his advice.</p>

		<p>Within headquarters, he has low interaction with his staff other than with Debbie and the other secretaries.
			He talks to Marc Hamburg (the CFO) regularly, although not necessarily daily. He talks with the bond trader.
			These conversations are very brief. You’ll notice this is a running theme while he does have long
			conversations, it’s only with a few friends and only on occasions of his choosing.</p>

		<p>In the office, he knows everyone’s name and occasionally walks down the hall and says hello to people. He is
			the furthest thing from a walk-around manager, though. He stays in his office (he is at one end of the hall)
			and everyone else sticks to their end.</p>

		<p><span style="color:orange;"> Interviewer:</span> Obviously he is a voracious reader and gets through things
			pretty quickly. How much time is spent on new ideas besides following the subsidiaries and general business
			press?</p>

		<p><span style="color:orange;"> Alice Schroeder:</span> You mean investment ideas?</p>

		<p><span style="color:orange;"> Interviewer:</span> Sure, whether it’s a new investment idea or not. He talks
			about enjoying books…I’m curious where he finds the time to do those kinds of activities (in addition to
			investing).</p>

		<p><span style="color:orange;"> Alice Schroeder:</span> Yes, he’s mostly updating himself. Books and
			entertainment would be at home.</p>

		<p><span style="color:orange;"> Interviewer:</span> Is there anything that surprised you about his daily routine
			or communications?</p>

		<p><span style="color:orange;"> Alice Schroeder:</span> While I was an analyst, he would always say, “Call me
			anytime,” but I rarely did. I had this false notion that he was busy all day and it would be an imposition
			to call him. Later I learned some of his closest friends feel the same way, and meanwhile, Warren Buffett is
			sitting there in Omaha wishing more people would call him.</p>

		<p>Only certain people, though, that should be stressed. Essentially, only people who he is certain to have no
			expectations of talking to him get to talk to him.</p>

		<p>You know his saying about potential acquisitions, “If the phone doesn’t ring, you’ll know it’s me.” That’s
			not coming out of a vacuum. If you want to connect with Warren Buffett Buffett, do it in writing.</p>

		<p>Something to keep in mind is that Warren Buffett is extremely precise and literal in what he writes and says.
			You can tell this from reading his writings closely, but it was even more interesting to watch him create
			them in real time. It’s unwise to read more into his words than is there. It’s equally unwise to assume that
			everything you might want to know has been said.</p>

		<p>One thing I found surprising initially, but with hindsight not, is that Warren Buffett relies on those people
			who do call him as his window on the world. He needs eyes and ears.</p>

		<p>You know, if you’re Warren Buffett Buffett, you can’t walk into a Dairy Queen to check things out. People are
			always putting on a show for him. He appreciates the candid information and seeks it out.</p>

		<p>Through this vast network of connections that he’s built, he’s created a sort of database of information
			about business and the economy that’s probably irreplaceable.</p>

		<p><span style="color:orange;"> Interviewer:</span> Is he the type to call a “buddy” at a large corporation?</p>

		<p><span style="color:orange;"> Alice Schroeder:</span> I don’t want to say he never makes outgoing calls. But,
			more often than not, people call him.</p>

		<p><span style="color:orange;"> Interviewer:</span> So, jumping back to the book how did it progress (as you got
			to know him more intimately). Was there a change in focus over the first couple of years? What were the
			changes in how you wanted to organize his life?</p>

		<p>One of the very interesting things about Buffett is the dichotomy between his character and experiences. By
			that I mean he was 30 years old and a millionaire and very confident in a business sense?—?and at the same
			time he seems to be the shy nice guy (who can barely ask a girl on a date). So maybe you can comment on the
			young Buffett and how the book progresses from there.</p>

		<p><span style="color:orange;"> Alice Schroeder:</span> As he gave me more biographical information, I
			discovered more sources to interview, many suggested by him. So, as I got to know him better, I tended to
			reorganize and restructure the book to mesh with his personality and my advancing knowledge of him. You have
			to understand that I did most of the writing in the last 2 years. I was doing mostly research the first 2
			years.</p>

		<p>There was a critical path that very much influenced the process, of course. He was obviously the scarcest
			resource. So, I interviewed him as much as I could and as quickly as I could for a year and a half.</p>

		<p>The second-scarcest resource was access to his files so I went to that right away simultaneously while
			interviewing him.</p>

		<p>The third was people in his life who were very elderly. In a sense, I used the actuarial tables for guidance
			on when to interview people. I started with people over age 95, 90…and I worked my way down?—?but I still
			missed some people.</p>

		<p>It was too bad because there were people who were already deceased or in dementia, and I didn’t get to talk
			to them and missed getting to know them. One of the joys of this book was getting to know so many amazing
			people, and especially, spending time with wise elderly people. But I managed to get most of the key
			sources, and I felt it was appropriate to focus on them first, because, today, many of them are no longer
			around or aren’t in a position, physically, to provide the kind of insight into Warren Buffett Buffet that
			they so generously did when I was writing the book.</p>

		<p>I was still doing bits of research until right before the book was published, which is standard in
			journalism. As the emphasis switches from initial digging to fine-tuning, it goes from 80–20 research versus
			writing to 20–80. It’s not unlike researching a stock, really.</p>

		<p><span style="color:orange;"> Interviewer:</span> Please comment on the highlights of Buffet’s life through
			the view of his closest friends, family, etc. That is, the people you interviewed. Are there any milestones
			that people don’t know about or overlook in his character development?</p>

		<p><span style="color:orange;"> Alice Schroeder:</span> This was some of the “new news” in The Snowball. For
			example, his relationship with his parents and the role of mental illness in his family shaped his character
			and his whole career.</p>

		<p>He’s cautious and non-confrontational. He’s wary of extremes in all forms. He’s insistently reluctant to
			criticize anyone and hypersensitive to criticism himself. He needs to be liked and needs approval, but
			paradoxically is not a people-pleaser. He’s demanding of himself and has very high standards. He’s very
			oriented toward security … hyper-aware of risk. He’s got a keenly honed sense of justice but isn’t one to
			fight for it in an overt way; he can be timid when called upon for moral courage. He’s uncommonly clever at
			finding pragmatic, indirect solutions to problems, usually multiple problems taken care of by one solution.
			You can take those traits and look at his career and find strands of them everywhere.</p>

		<p>His relationships with women provide the most important window on his character. Susie had a very strong
			impact on his business career because she enabled him socially to overcome his shyness and get around in the
			business world. He has credited Dale Carnegie, but to fully understand the magnitude of her influence you
			have to carefully read the formative events in his life that involved her, something I went through in some
			detail in The Snowball. Warren Buffett’s relationship with Susie is as clear a window into who he is, his
			traits and temperament, as any other.</p>

		<p>His hard work in the social area to overcome his natural awkwardness is what enabled him to get past the
			front door with Katherine Graham. If you look back on his career and think of all the things that happened
			to him that wouldn’t have had Kay Graham not entered his life, it’s immense.</p>

		<p>You can never know what the other path would have been, because he is obviously brilliant, and other good
			things would have happened. But his Washington connections, media connections, all of these different things
			led to many of his investments, and his pleasures in life, and they originated from Katherine Graham. Given
			his strategic way of thinking, it’s not surprising that he arranged to get exposure to her.</p>

		<p>Even the GEICO investment was influenced by Katherine Graham. She introduced him to Jack Byrne. He made his
			decision to invest in GEICO partly because he thought Jack Byrne was the right person to be the CEO.</p>

		<p><span style="color:orange;"> Interviewer:</span> Earlier I asked you from the point of view of an analyst but
			now I would like to as you as an author, did you get an “Aha!” feeling that Warren Buffett wasn’t a typical
			human being? When did that hit you and how did it hit you?</p>

		<p><span style="color:orange;"> Alice Schroeder:</span> That was obvious when I met him as an analyst in the
			first 5 minutes of the conversation. When he opens his mouth it just comes through. His way of articulating
			ideas is very original. He is a great synthesizer and especially strong at pattern recognition. He’s also
			able to follow what I would call it decision trees and figure out probabilities in his head at an
			astonishing pace.</p>

		<p>So, when you are in a conversation with him, he has worked out many of the directions in which the
			conversation can go, the likelihood of each, and how he wants to manage his end of it. He’s reading you
			emotionally too. You recognize that right away in a conversation with him. You realize he’s many moves ahead
			of you on the chess board. It is eerie, but also fascinating.</p>

		<p>You also can see how unusual he is because he’s a great teacher. If you ask him questions he loves to convey
			the things he’s learned.</p>

		<p><span style="color:orange;"> Interviewer:</span> What makes him such a wonderful teacher?</p>

		<p><span style="color:orange;"> Alice Schroeder:</span> Well, first, it is that he enjoys teaching and, second,
			that he has worked hard at learning communication skills and specifically learning to communicate as a
			teacher. So, he knows how to order material, how to tell stories, he knows how people process information.
			It’s also, I think, a valuable insight that teaching is one of his preferred modes of talking to people much
			of the time. You could almost call it his default mode. And that the value, influence, and trust he built by
			being such a memorable teacher of investing, business, and life in his public communications was, from a
			relatively early period, a very important ingredient for his tangible business success. This began as early
			as high school but was crucial to running the Buffett partnerships and later Berkshire Hathaway. I think
			this point is actually still quite underappreciated among even his most obsessive followers.</p>

		<p><span style="color:orange;"> Interviewer:</span> Give us advice on becoming better communicators.</p>

		<p><span style="color:orange;"> Alice Schroeder:</span> Well…this is not anything profound. But you see that he
			uses very short parables, stories, and analogies. He chooses keywords that resonate with people?—?that will
			stick in their heads, like Aesop’s fables, and fairy-tale imagery. He’s good at conjuring up pictures in
			people’s minds that trigger archetypal thinking. It enables him to very quickly make a point … without
			having to expend a lot of verbiages.</p>

		<p>He’s also conscientious about weaving humour into his material. He’s naturally witty, but he’s aware that
			humour is enjoyable and disarming if you’re trying to teach something.</p>

		<p><span style="color:orange;"> Interviewer:</span> What is your favourite part of the book?</p>

		<p><span style="color:orange;"> Alice Schroeder:</span> Okay, well I won’t say favourite because that is similar
			to picking your favourite child. There are parts of the book that I love for all kinds of different reasons.
			There is one intellectually challenging and interesting part of me that I think is intriguing and has been
			paid less attention.</p>

		<p>I was able to put together how he created BRK out of Blue Chip and Diversified. I was also able to put
			together how he created his partnership. That was nearly all new information.</p>

		<p>I found it fascinating to see brick by brick how he did this. It deserved study because it ran to the
			question of what a great business is. These are the businesses that he created for himself.</p>

		<p><span style="color:orange;"> Interviewer:</span> This section is portrayed along with a diagram of Berkshire
			and the subsidiaries</p>

		<p><span style="color:orange;"> Alice Schroeder:</span> Yes, although the story begins at the point in which he
			closes the partnership, and it ends with the Buffalo News, which runs through multiple chapters.</p>

		<p>The creation of the partnership is primarily in the chapter called Hidden Splendor. But there are bits of it
			before that chapter.</p>

		<p><span style="color:orange;"> Interviewer:</span> I see. I want to return to your interviews with Buffett’s
			inner circle. As you are interviewing these people what are the similarities in what they reveal about
			Warren Buffett?</p>

		<p><span style="color:orange;"> Alice Schroeder:</span> Yes, in fact, it was so repetitive that I could tell
			that some of these people had been interviewed so many times before and spent enough time talking to each
			other that it had a sometimes-rehearsed quality.</p>

		<p>Wit, loyalty, &amp; honesty were the 3 qualities that were cited over and over.</p>

		<p>He’s extremely witty. He can knock out a one-liner every few seconds. One of the nicer aspects of being
			around him is the easy humour of the conversations. I tried to include as many quotes as I could in The
			Snowball so that readers could get a sense of what a terrific conversationalist he is. When Michael Lewis
			reviewed The Snowball in The New Republic magazine, his conclusion from reading these quotes was that
			“Buffett is incapable of being dull,” which is so true.</p>

		<p>In terms of loyalty, Buffett cherishes relationships and has gone to a lot of effort to maintain contact with
			old friends. Far more so than the average person does. He told me once that his mother got more than 65
			birthday cards on her 65th birthday. This was a real point of pride. There’s an element of the collector
			that comes to the forefront in his loyalty about people. It’s not dissimilar to the way he views the
			companies Berkshire owns as paintings in a museum.</p>

		<p>He’s almost painfully honest at times. Yet some people I interviewed belaboured his honesty beyond the point
			that made sense. They would belabour it to such a degree that you began to realize they held some specific
			concerns in this area. Eventually, it became clearer that this had to do with the incidents in his life
			where he has been ruthless. I included some representative examples in The Snowball, but space allowed only
			a fraction to make it into the book.</p>

		<p>Look, he’s allowed to be human. He’s a decent, honest, admirable person of integrity who’s accomplished
			magnificent achievements. That should be enough. Surely people realize that he didn’t get where he is by
			running a philanthropic institution. But some who are loyal to Warren Buffett equate loyalty with portraying
			him as infallible. Those two things are not the same. It’s not necessary at all to pretend that someone is
			infallible in order to be loyal and admire them. I found in the case of Warren Buffett Buffett that there
			were people who genuinely believed that if they admitted any imperfections in him, it would make them
			disloyal.</p>

		<p><span style="color:orange;"> Interviewer:</span> They were turning him into a saint, so to speak?</p>

		<p><span style="color:orange;"> Alice Schroeder:</span> They were, and, the more you saw it, the sillier it
			became. I will never forget a few people insisting to me that Warren Buffett is really not that interested
			in money.</p>

		<h2 id="part-5-buffett-the-investor-businessman" id="part-5-buffett-the-investor-businessman">Part 5: Buffett-
			The Investor &amp; Businessman</h2>

		<p><span style="color:orange;"> Interviewer:</span> How is Warren Buffett different than other value investors?
		</p>

		<p><span style="color:orange;"> Alice Schroeder:</span> He’s more interested in money, for one thing (laughs).
		</p>

		<p>In terms of how that affects his investing behaviour, number one, in his classic investments he expends a lot
			of energy checking out details and ferreting out nuggets of information, way beyond the balance sheet. He
			would go back and look at the company’s history in depth for decades. He used to pay people to attend
			shareholder meetings and ask questions for him. He checked out the personal lives of people who ran
			companies he invested in. He wanted to know about their financial status, their personal habits, what
			motivated them. He behaves like an investigative journalist. All this stuff about flipping through Moody’s
			Manuals picking stocks … it was a screen for him, but he didn’t stop there.</p>

		<p>Number two, his knowledge of business history, politics, and macroeconomics is both encyclopaedic and
			detailed, which informs everything he does. If candy sales are up in a particular zip code in California, he
			knows what it means because he knows the demographics of that zip code and what’s going on in the California
			economy. When cotton prices fluctuate, he knows how that affects all sorts of businesses. And so on.</p>

		<p>The third aspect is the way he looks at business models. The best way I can describe this is that its as if
			you and I see an animal, and he sees its DNA. He isn’t interested in whether the animal is furry; all he
			sees is whether it can run and how well it will reproduce, which are the two key elements that determine
			whether its species will thrive.</p>

		<p>I remember when his daughter opened her knitting shop. Many parents would say, I’m so proud of Susie, she’s
			so creative, this is something of her own, maybe she can make a living at it. Warren Buffett’s version is,
			I’m so proud of Susie, I think a knitting shop can produce half a million a year in sales, they’re paying
			whatever a square foot for the storefront and labour is cheap in Omaha. It was similar when Peter was
			producing his multimedia show, The Seventh Fire. Many parents would say, wow, my son has pulled off a
			critically acclaimed show. Warren Buffett obviously thought that, but what he articulated was, they’re
			charging $40 a ticket, I think the Omaha market is too small for that price point, whereas in St. Louis,
			they may cover the overhead, and I think he paid too much for the tent because the audience doesn’t really
			care what kind of tent it’s sitting in and it hurts margins, etc. etc.</p>

		<p><span style="color:orange;"> Interviewer:</span> Speaking of tents. I have never been to the BRK shareholder
			meeting. Has it become cult-like at this point?</p>

		<p><span style="color:orange;"> Alice Schroeder:</span> I started going in the late 90’s. I envy people who were
			going earlier. But I’ve been going long enough to see how it has grown over the years and turned into more
			of a circus. Warren Buffett has got a huge streak of P.T. Barnum in him and likes to put on a show that
			every year, tops itself. He encourages the cult. It’s like the nerdy kid whose lunch money was stolen grew
			up, and now even the popular kids treat him like a god. Put yourself in his shoes and you’ll get a sense of
			it.</p>

		<p>From the perspective of the shareholders, I think there used to be more serious investing content. Warren
			Buffett uses set pieces to describe certain ideas that he repeats tirelessly. This is efficient; hell, never
			be caught out for being inconsistent; it drills home his points through repetition. Its also simply the way
			his mind works. He thinks of a story to explain a concept (Sees Candies = moat) and when the subject comes
			up, he turns on the mental tape recorder and it plays. Repetition doesn’t bore him the way it bores other
			people.</p>

		<p>At the shareholder meeting, I do think the repetition stokes the cult because it discourages people who used
			to come for the unfolding, unique quality of the dialogue from attending.</p>

		<p><span style="color:orange;"> Interviewer:</span> Okay, so back to Warren Buffett tell us about his ruthless
			side?</p>

		<p><span style="color:orange;"> Alice Schroeder:</span> Sure…sure… How he bought National Indemnity; how he
			bought the stock back from his partners; how he bought and got his price for Nebraska Furniture Mart; how he
			has dealt with labour unions. Salomon is another instance, and probably the best publicly-known example.</p>

		<p>To use a non-public example, I’ve seen him “encourage” people to do what he wants by subtly raising the
			possibility of what he might leave them in his will. But without promising anything. This is torture for
			some people; they are always working for a commitment that never comes.</p>

		<p>Another aspect to it is the degree to which other people are the bad cop when it’s necessary to be ruthless.
			I once commented to him on the way he uses other people as surrogates to protect himself from being the bad
			guy, and his response was, “Prepare to be enlisted,” not really jokingly. Now that I think of it, in a
			sense, I did get enlisted.</p>

		<p>Giving the managers sole responsibility for everything that happens at their businesses is always described
			as a unique and friendly aspect of Berkshire. While that is true on one level, it is also a way of
			protecting Warren Buffett. Warren Buffett takes being risk-averse to a level that is barely comprehensible.
			He has boundaries made of steel. If he can’t control something completely he doesn’t want to control it at
			all. It’s how he behaved with the partnership, and he’s extended this to Berkshire Hathaway.</p>

		<p>Therefore, this way of delegating “to the point of abdication” (in his words) is actually filed with the SEC;
			the 10-K for Berkshire Hathaway emphasizes that it is unusually decentralized and that Warren Buffett
			delegates to an extreme degree. I’ve seen Warren Buffett claim that he cannot overrule a decision of Debbie
			Bosanek: not that he is delegating to her, but that he actually isn’t empowered to overrule her.</p>

		<p>If there were ever a serious shareholder class action lawsuit, the lawyers would pull out the 10-K and claim
			that Warren Buffett should not be deposed because he is not really responsible for what happens at
			Berkshire. There’s an absurdity to it because the CEO of a company is responsible for the actions of his
			direct reports whether he wants to be or not. Their title is a manager, not CEO.</p>

		<p>Lastly, Warren Buffett can sometimes have a hard time seeing the human side of things. So, for example, when
			his sister was close to filing for bankruptcy after the crash of 1987, he rationalized not helping her on
			the grounds that if he helped her, he was helping her creditors, who were market speculators. His kids have
			been on the receiving end of similar episodes, large and small, for years. But I’d rather not tell other
			peoples stories and expose them to the potential consequences.</p>

		<p><span style="color:orange;"> Interviewer:</span> I see what you’re saying. I remember a story regarding his
			children (or friends of his children) and him saying “If I do it for you, I have to do it for everyone.”</p>

		<p><span style="color:orange;"> Alice Schroeder:</span> That’s a favourite phrase of his. It’s actually a great
			concept. He’s wise to be wary of setting precedents. You have to think through the whole chain of
			consequences before you agree to what might seem like a small favour. That’s especially true of someone in
			his position.</p>

		<p>Still, it can become a catch-all excuse. It’s not true that if he gave money to one friend’s charity, he
			would have to give to everybody’s. You can make distinctions between your kids based on their individual
			needs. He’s capable of making choices.</p>

		<p><span style="color:orange;"> Interviewer:</span> What you are saying about setting precedents? It reminds me
			of Cialdini’s tactics of persuasion and especially reciprocation and foot in the door technique.</p>

		<p><span style="color:orange;"> Alice Schroeder:</span> Yes…When I read Cialdini I thought, “Gosh. It’s as if
			Warren Buffett wrote this book based on his experience.”</p>

		<p><span style="color:orange;"> Interviewer:</span> He understands the psychology of people.</p>

		<p><span style="color:orange;"> Alice Schroeder:</span> Reciprocity and Social Proof. Those are his top two
			techniques.</p>

		<p>I think it was also Cialdini who mentioned that if people do you a favour they like you more. Warren Buffett
			has an ability to get people to invest psychologically in him.</p>

		<p>One reason he prefers people visit him in Omaha is that somebody spending the time and money to make that
			journey is going to leave persuaded. They aren’t going to go away thinking they wasted their money. Because
			the way you resolve cognitive dissonance is in whatever way makes you feel most comfortable.</p>

		<p>Now obviously it’s not a waste to go see Buffett speak. What I’m saying is that this kind of structural
			persuasion and elicited psychological investment tilts the odds in his favour.</p>

		<p><span style="color:orange;"> Interviewer:</span> So, it’s almost like an emotional sunk cost. You don’t think
			of it as a sunk cost so you keep reinvesting emotional resources to sustain a view or experience.</p>

		<p><span style="color:orange;"> Alice Schroeder:</span> Yes.</p>

		<p><span style="color:orange;"> Interviewer:</span> What else can you tell me about his ruthlessness? It’s
			interesting that he can be so strong-willed and yet has that characteristic where he is very cautious and
			doesn’t want to be disliked. Where does this strength come from? From my interpretation of your book, it
			seems to stem from a young age. That is to say, he has a backbone when it comes to business and money even
			from an early age.</p>

		<p><span style="color:orange;"> Alice Schroeder:</span> No one can ever know for certain but I believe it was
			innate in him. He told me a story about when he was 6 years old, and a customer wanted him to break a pack
			of gum that he was selling into individual pieces.</p>

		<p>His reaction was, “I’ve got my principles,” and he refused to do it. I don’t think anyone taught him that. I
			think he was born with that.</p>

		<p><span style="color:orange;"> Interviewer:</span> Tell me about his memory. I ask about this because
			psychological research has uncovered a capacity for forming false memories and yet Warren Buffett seems to
			retain massive amounts of information (with minimal distortions). In your opinion, how does Buffett’s memory
			work?</p>

		<p><span style="color:orange;"> Alice Schroeder:</span> Well I wrote about the bathtub memory in the book. If
			something is unpleasant, it goes down the drain. He also retains a sort of DVD of events in his head.</p>

		<p>If there is new information the old version gets overwritten. It’s gone. He remembers stories and certain
			facts, and the rest is discarded as if for efficiency or comfort.</p>

		<p>So, let’s say he is at a party. There will be 2 things he remembers. He will remember that Carol Loomis wore
			a yellow dress and that somebody else told him a certain joke. That is all he will remember. It’s as if the
			rest disappears. Sometimes hell remember more if prompted, but there’s not much fuzziness. Either he
			remembers something or he doesn’t.</p>

		<p>Then, if it turns out the joke was a different one than he thought, it’s as if he never heard of the first
			joke.</p>

		<p>That is not to say he believes his own memory is infallible. He’s keenly aware of how stories are transmuted
			through the telling. He was very clear (and upfront) with me about this in the beginning. One reason he
			said, “Use the less flattering version,” is that he thought other people might remember things better than
			him.</p>

		<p><span style="color:orange;"> Interviewer:</span> What about his memory in terms of investments?</p>

		<p><span style="color:orange;"> Alice Schroeder:</span> Oh, that’s freaky. You’re sitting there talking about
			something like “Isn’t it amazing that after Jack Welch left GE, the company started having all these
			problems because of buried accounting issues?” and he will say, “Yes, that’s like …” and pull a company from
			30 years prior and start spouting numbers. Then he will pick another more recent company and another.</p>

		<p>He has accumulated a filing cabinet of knowledge about companies, and it’s very big. Part of his teaching
			style is to have certain examples at the ready.</p>

		<p><span style="color:orange;"> Interviewer:</span> How has he developed this mental database?</p>

		<p><span style="color:orange;"> Alice Schroeder:</span> Well I think there are things you can do to improve
			recall. But there is something to be said about being born with a prodigious memory. It seems to me that
			there are 3 qualities of great investors that are rarely discussed:</p>

		<p>They have a strong memory;
			They are extremely numerate;
			They have what Warren Buffett calls a “money mind,” an instinctive commercial sense.
			Warren Buffett is all of these.</p>

		<p>By numeracy, I mean an excellent recall for numbers, fast mental arithmetic skills, and preferably, an
			intuitive grasp of the time value of money, intuitive enough that you don’t necessarily need a calculator to
			do basic calculations.</p>

		<p>The money mind is far more important than the others.</p>

		<p><span style="color:orange;"> Interviewer:</span> Tell me a little more about this.</p>

		<p><span style="color:orange;"> Alice Schroeder:</span> Warren Buffett’s skills as an investor have often been
			compared with a musician, and I think that’s exactly right. The “money mind” is an instinct, almost a sixth
			sense, of sniffing where there is an opportunity to make money and knowing how to exploit it. Somebody who
			is starting businesses when they are six years old is different than the average kid. When you apply focus
			(which he often talks about) to those three qualities then your skills as an investor are turbo-charged.</p>

		<p><span style="color:orange;"> Interviewer:</span> How can we develop more of a money mind? Is this the part
			that is more innate or is it more a consequence of him being an entrepreneur at a young age?</p>

		<p><span style="color:orange;"> Alice Schroeder:</span> I have had many conversations with him about this. He
			thinks it’s innate. There are people who just naturally gravitate towards activities that make money. That’s
			not a value judgment. Something else might be more socially useful. However, I also believe the average
			person can be trained to become much more “money aware.” You can train yourself to do an amazing amount … to
			go from being average to becoming good. But you will have to work at it in a way that someone like Warren
			Buffett will not.</p>

		<p><span style="color:orange;"> Interviewer:</span> You say it’s important to be numerate. Is this what
			attracted you to accounting?</p>

		<p><span style="color:orange;"> Alice Schroeder:</span> No. Personally, I have a lopsided skill set when it
			comes to mathematics. Patterns of numbers are not like musical bars to me. I was decent at geometry, higher
			math but had to work at them. Where I excelled was statistics. I did extremely well at statistics. It’s
			interesting but Charlie Munger says that’s the course that isn’t mandatory but should be.</p>

		<p>Insurance is a business of statistics and probability. I have wondered whether the mathematics of statistics
			uses a different part of your brain than discrete math.</p>

		<p><span style="color:orange;"> Interviewer:</span> Are there any other traits that act as a magnifying glass
			for Warren Buffett? Comment on how his traits help him see the world in a different way?</p>

		<p><span style="color:orange;"> Alice Schroeder:</span> Yes. There is temperament. His emotional oscilloscope
			moves in quite a narrow range. That’s useful when you’re playing against with Mr.Market. He’s stressed it as
			an essential quality.</p>

		<p>I also believe his understanding of human nature is immensely valuable. He is superb at figuring out what the
			great businesses are, but great people must run them. And he has been successful at seeking out really
			terrific management. He has made a few whopper mistakes, but they are definitely outliers in the trend of
			being great at picking top people.</p>

		<p><span style="color:orange;"> Interviewer:</span> What are Warren Buffett’s weaknesses as an investor?</p>

		<p><span style="color:orange;"> Alice Schroeder:</span> It’s as if large amounts of money paired with limited
			risk can overwhelm his peripheral vision. So, if there’s is a disproportionate opportunity to make money in
			what is a superficially a protected way such as through a preferred stock where your downside is limited, he
			doesn’t blink at things that would normally give him pause.</p>

		<p>He did this with US Air and Salomon Brothers. You could also argue Goldman Sachs convertible preferred and
			USG were hardly typical investments.</p>

		<p>Second, sometimes he will decide on some theory upon which he wants to invest in something even if it’s not
			an obvious barn burner in terms of financial aspects.</p>

		<p>BNSF is an example. You have people championing this for all sorts of reasons, but certainly, it did not meet
			his normal investing metrics. That doesn’t mean it was a mistake, but it may be a good investment for
			different reasons than people think.</p>

		<p>Sometimes he falls in love with people and invests accordingly or, worse, falls in love with people because
			they’ve sold him their companies. He fell in love with John Gutfreund at Salomon, and with Ron Ferguson at
			General Re. Among others.</p>

		<p>Lastly, he clearly has a blind spot when it comes to anything that flies and has wings.</p>

		<p><span style="color:orange;"> Interviewer:</span> Meaning?</p>

		<p><span style="color:orange;"> Alice Schroeder:</span> Meaning he has invested 3 times in aviation: Pacific SW
			Airways, USAir, and NetJets. These have ranged from near-misses to disasters. He hasn’t had good luck with
			aviation. He’s called himself an Air-a-Holic. It’s a weird little quirk to see this in somebody that you
			think of as super-rational.</p>

		<p><span style="color:orange;"> Interviewer:</span> What other blind spots does he have that we can learn from?
		</p>

		<p><span style="color:orange;"> Alice Schroeder:</span> I’m sure I could think of other things, but it would be
			disproportionate to spend more time focusing on blind spots. His accomplishments outweigh his blind spots by
			so much.</p>

		<p><span style="color:orange;"> Interviewer:</span> Sure.</p>

		<p><span style="color:orange;"> Interviewer:</span> Do you think there is a particular reason for his focus on
			consumer and financial companies?</p>

		<p><span style="color:orange;"> Alice Schroeder:</span> Yes. With financial companies, you have leverage that
			can be controlled, “regulatory oligopoly,” and trust. Insurance float is only one example of leverage. The
			spread on “float” in banking can be controlled too if you lend intelligently. Banking is a nice little
			business for the few who are willing to do it in a vanilla manner. “Regulatory oligopoly” is the entrenched
			competitive position that’s, in effect, provided by your regulator and its rules. It can give you quite a
			few, or few hundred, extra basis points of return.</p>

		<p>I think Buffett’s consumer plays have been overrated as a theme. He likes good companies with enduring
			business models. Many happen to have been consumer companies. He got intrigued by the idea that a brand
			could be a very enduring asset. Then he was surprised at how quickly the value of brands eroded in the
			1990’s. Brands with true “moats” are exceedingly rare. Of course, he wants one when he can get it, but these
			companies usually also are expensive.</p>

		<p><span style="color:orange;"> Interviewer:</span> Maybe I can ask you a tangential question. Many value
			investors follow this lead of avoiding all macroeconomics, whether it’s risk, etc. Tell us about the way he
			looks at the economy as a whole? How does he factor that into his database and decisions?</p>

		<p><span style="color:orange;"> Alice Schroeder:</span> Buffett is keenly aware of the economic cycle and
			relevant data. He uses economic data to put context around what is happening in specific businesses. Meaning
			that it lets him visualize macro-risks at the company-specific level. Second, macro data signals to Buffett
			where Mr.Market is going awry, for example, what parts of the stock market might be fertile digging grounds.
		</p>

		<p>For example, he knew to some degree that we were in a bubble in the past few years (leading up to 2008)
			because you could do some statistics that would show corporate profits being at unsustainable levels and
			housing growth exceeding demographics to a ridiculous degree. He didn’t get into the mortgage business,
			although you’d better believe, people were showing up on his doorstep urging him to do it with all sorts of
			apparently lucrative deals. The economy is context.</p>

		<p><span style="color:orange;"> Interviewer:</span> How else does he process macroeconomic information? How does
			this relate to his fascination with history?</p>

		<p><span style="color:orange;"> Alice Schroeder:</span> History was one of Warren Buffett’s best subjects even
			when he was very young (in school). He has a liking for it. But at the same time pattern recognition is one
			of his primary skills and perhaps his greatest skill. So, in terms of data points, unlike many people who
			learn by seeking information on an as-needed basis, Warren Buffett is always looking for fuel for pattern
			recognition before he needs it.</p>

		<p>He’s always looking for context. Having an interest in a broad sweep of history provides vast context for
			making many decisions because it enables analogies. And that I think has been very helpful for him in
			avoiding fallacies such as “This time it’s different.”</p>

		<p>It allows him to make analogies between industries, for example between the internet/dotcom stocks and early
			auto stocks, as in the speech he gave at Sun Valley that is described in The Snowball.</p>

		<p><span style="color:orange;"> Interviewer:</span> Tell me more about his pattern recognition skills? How is
			this one of his greatest skills?</p>

		<p><span style="color:orange;"> Alice Schroeder:</span> Take this example. If you look at the dotcom stocks, the
			meta-message of that era was world-changing innovation. He went back and looked for more patterns of history
			when there was a similar meta-message, great bursts of technological innovation in canals, aeroplanes,
			steamboats, automobiles, television, and radio. Then he looked for sub-patterns and asked what the outcome
			was in terms of financial results.</p>

		<p>With the dotcoms, people were looking to see what was different and unique about them. Warren Buffett is
			always thinking what’s the same between this specific situation and that of every other situation.</p>

		<p>That is the nature of pattern recognition, asking “What can I infer about this situation based on
			similarities to what I already know and trust that I understand?” There is less emphasis on trying to reason
			out things on the basis that they are special because they are unique, which in a financial context is
			perhaps the definition of a speculation. (Warren Buffett is not averse to speculation, by the way, as long
			as it’s what he calls “intelligent speculation,” meaning he’s got long odds in his favour.) But pattern
			recognition is his default way of thinking. It creates an impulse always to connect new knowledge to old and
			to primarily be interested in new knowledge that genuinely builds on the old.</p>

		<p><span style="color:orange;"> Interviewer:</span> Comment on Warren Buffett Buffett’s emotions. I’m
			particularly interested in his ability to be so rational and unemotional.</p>

		<p><span style="color:orange;"> Alice Schroeder:</span> This is a great segue. Pattern recognition skills are
			worthless if you invent patterns that aren’t there. My one really difficult experience as an analyst was at
			PaineWebber during the dotcom bubble. It was like bullishness was a drug poured into the NYC water supply.
			Everyone believed. The idea that investment banking pressure was solely responsible for the Internet bubble
			has been overplayed. We were a wirehouse, and we drank the Kool-Aid just like everybody else.</p>

		<p>People think Wall Street was cynical; there was less cynicism than history has recorded. Largely, the
			predictions about the Internet’s transformative power were true. There just wasn’t a lot of money in it for
			investors. It is another favourite theme of Warren Buffett’s. The futility of standing on tiptoe at the
			parade.</p>

		<p>I recommended insurance stocks when they looked moderately priced, and then followed them all the way down to
			dirt cheap. Nobody wanted to buy anything real. My stock calls were mostly awful, and they would have been
			awful no matter what I picked unless I had said to sell the whole group. It’s that difference between
			stock-picking and investing.</p>

		<p>Somehow, Warren Buffett was able to ignore the whole thing. People sometimes speculate that he is
			emotionless, and I’m frequently asked if he is autistic. He’s certainly not emotionless, but his emotional
			pendulum swings in a very narrow arc except on those rare occasions when something personal has deeply upset
			him. While he does use rules to make decisions, it’s key that he’s detached and not temperamentally
			excitable, to begin with.</p>

		<p>On business matters, his steady pulse is helped by his exceptional skill at reading other people’s emotions.
			He reads people in a conscious manner that could be the result of self-training to recognize” emotional
			tells”; even so, he’s remarkably fluent at it. If this skill could be bottled he could sell it for an awful
			lot of money.</p>

		<p>Temperament is innate, but I would argue that anyone can focus on modulating their temperament within
			whatever band they have to work with. Anyone can work at being better at reading other people’s emotions.
		</p>

		<h2 id="part-6-curve-ball-surprising-facts-about-warren-buffett-buffett"
			id="part-6-curve-ball-surprising-facts-about-warren-buffett-buffett">Part 6: Curve Ball?—?Surprising Facts
			About Warren Buffett Buffett</h2>

		<p><span style="color:orange;"> Interviewer:</span> How has Warren Buffett Buffett’s intellect surprised you
			over the years?</p>

		<p><span style="color:orange;"> Alice Schroeder:</span> For example, he recognizes square roots and sometimes
			cube roots of very large numbers; which is slightly unnerving, especially when he starts telling you the
			square and cube roots of license plate numbers.</p>

		<p>It’s something he does as a mild form of entertainment while driving.</p>

		<p>More unnerving is that he remembers conversations that he has with you better than you do. I don’t know if
			you’ve ever been in that situation –- where you realize the other person has asked you the same question
			some time ago. When Buffett does that, it’s often a test. He will ask very probing and penetrating questions
			and then 2 months later he will ask again and you know he remembers the exact words you said. It can feel a
			little like getting deposed, and it’s a bit spooky to have a human tape recorder sitting in front of you. He
			doesn’t have a photographic memory, but sometimes it feels close enough. And of course, he’s reading you
			emotionally at the same time, and you know it.</p>

		<p>Please understand, this only happens occasionally. Most conversations with him are really enjoyable because
			they’re full of witty repartee and a download of information from his unusual brain.</p>

		<p>Other interesting situations: I have seen him make his famous 5-minute decisions on the phone. Five minutes
			is the outside amount of time it takes him to make a decision. If the person can be succinct and convey the
			salient points in 60 seconds hell say, “Yes” or “No” in 60 seconds.</p>

		<p>The time is determined by how long it takes the person to convey the salient points, not how long it takes
			him to think about it. It’s virtually instant once he has grasped the 2 or 3 variables or points that are
			important to him.</p>

		<p>Typically, and this is not well understood, his way of thinking is that there are disqualifying features to
			an investment. So, he rifles through and as soon as you hit one of those it’s done. Doesn’t like the CEO,
			forget it. Too much tail risk, forget it. Low-margin business, forget it. Many people would try to see
			whether a balance of other factors made up for these things. He doesn’t analyse from A to Z; its a
			time-waster.</p>

		<p>Lastly, the speed of thought is so startling. Remember the 60 questions I started with the first time I
			interviewed him, which he covered in 45 minutes or so.</p>

		<p>He later took me to Nebraska Furniture Mart carpet warehouse and started quoting how many yards they sell of
			each type of carpet each week and at x price and it costs y amount a yard and we mark it up at z. He was
			sprinting through the carpet warehouse pointing at roles of carpet and telling me which ones sell at what
			price.</p>

		<p>I jogged alongside him with my jaw dragging behind me on the floor in disbelief.</p>

		<p>I used to spend 4.5 days a week in Omaha, and I would be so wrecked by the time I got home it was
			unbelievable.</p>

		<p>I thought it was me; then, when I started interviewing other people who are his friends and colleagues, they
			would tell me that they also needed time to recuperate after seeing him. Or that they could only take him in
			doses of 2 hours at a time.</p>

		<p>They all like him, but it’s so intense to have someone racing ahead of you mentally and you are trying to
			keep up.</p>

		<p>This is clearly one reason for his bond with Bill Gates. They don’t have to wait for each other to catch up.
		</p>

		<p><span style="color:orange;"> Interviewer:</span> Tell me more anecdotes, particularly about his processing
			skills.</p>

		<p><span style="color:orange;"> Alice Schroeder:</span> I don’t want to dispel any notion of his intuition. But
			he has internalized so much information over the years and uses so many mental models (to quote a Mungerism)
			that they have coalesced into an almost visceral reaction to an investing situation. And this is what you
			strive for. It’s not mystical, even if you can’t verbalize your analysis. Much of his decision-making has
			sunk to almost the unconscious realm, it is so refined.</p>

		<p>Part of his skill and speed comes from a complete unwillingness to overpay for anything, which I think, is
			innate or formed in him by the time he very young. When he spots something it’s like a siren goes off
			telling him its overpriced (either quantitatively or qualitatively).</p>

		<p>We would kick around insurance pricing at different times. He would say, “How much would you pay to write
			terrorism risk on this building from now 2002 until 2012 for X events?” I would give some number and then he
			would say yea or nay.</p>

		<p>Because I like probabilities and have enough experience with insurance, I usually did okay with this game.
			But his ability was remarkable. You could describe a situation with many contingencies, many derivatives,
			many puts and calls and swaps, and he would instinctively know whether it was priced well or not.</p>

		<p>Those equity-index-puts that created issues with the rating agencies. I think the reason he had difficulty
			with those is that he knew immediately how to price them and that the odds were very high that they would
			make money for Berkshire if looked at on their own as contracts.</p>

		<p>The other elements that were subjective the way they would create short-term volatility in the balance sheet;
			the way hedgers might respond; the regulating agencies these didn’t come into the equation because the
			trained, automatic part of his mind fastened on how much money could be made and the probability.</p>

		<p>If you think about it carefully you realize how costly the equity index puts were in the financial crisis.
			Berkshire got the float from them to invest, but its negotiations with the rating agencies meant that, at a
			time when markets were in turmoil, during the very crisis that Warren Buffett had been waiting for all those
			years to put the tens of billions of dollars to cash to work, he couldn’t do it. He was able to participate
			in the market crash only in a tepid way. That opportunity cost has to be offset against the expected profit
			from those equity index puts. They weren’t worth it.</p>

		<p><span style="color:orange;"> Interviewer:</span> So what kinds of questions are not being asked about Warren
			Buffett? And on the flip side, what is overplayed with regards to his investment style (such as focusing on
			brands)?</p>

		<p><span style="color:orange;"> Alice Schroeder:</span> We touched on this earlier. He is great at distilling
			important concepts into memorable sayings. But these sayings are not a substitute for doing work and
			analysis and he doesn’t use them that way in practice. For example, be greedy when others are fearful and
			fearful when others are greedy, which is a Gus Levy (former CEO of Goldman Sachs) quote that he uses a lot.
		</p>

		<p>I’ve seen people rationalize buying a beaten-down stock because other people are fearful. That’s not how
			Warren Buffett thinks. For the most part, he has a universe of stocks that he has analysed. And when
			something hits his bid then he will buy it.</p>

		<p>I think another thing people have gotten confused about is the sustainable competitive advantage and the
			moat. Durable competitive advantage and moats are not the same things as brands. People sometimes use these
			terms interchangeably. I have also seen people ascribe competitive advantages to brands that don’t have
			them. For example, retailers have brands. We all know what Macy’s is, but retailing is fundamentally a bad
			business.</p>

		<p>In essence, the merits of a brand are not the brand itself; they are the qualities of the product that create
			the consumer loyalty. What attracted him, ultimately, to Coca-Cola is that Coca-Cola’s formula makes you
			more, not less, thirsty, and supposedly has been tested to prove that it doesn’t wear out the palate, no
			matter how much is consumed.</p>

		<p>This implies infinite sales potential. The cute commercials and cheery red logo create an association in
			peoples’ minds with those qualities. They aren’t what makes it Coca-Cola.</p>

		<p>While there are moats that include brands, a brand is not a moat. The moat is whatever qualities are innate
			to the business that makes it difficult to compete with.</p>

		<p>Lastly, investing is not a religion. It’s not like you have to follow a creed. Warren Buffett will buy things
			that are simply cheap. He’s pragmatic. There’s no rule that he has to be absolutely consistent. If he sees
			something that he thinks is undervalued hell occasionally buy it, even if it’s a Korean dairy company. Then
			he’ll sell it. Everything doesn’t have to fit into a perfect framework.</p>

		<p><span style="color:orange;"> Interviewer:</span> What are other things to avoid?</p>

		<p><span style="color:orange;"> Alice Schroeder:</span> One of Warren Buffett’s great strengths is that, despite
			his pragmatism, he is quite rigid when it comes to anything that could lead to emotional decision-making.
			This is the circle of competence. He never bought Intel, and if there is anyone who could have understood
			Intel it was him. I mean, he knows Andy Grove quite well and was around at the founding of the company and
			even knew Bob Noyce. There were times when it must have been obvious to him that Intel was a rocket.</p>

		<p>This is another way of saying that he has managed to avoid style drift for the most part. There’s nothing
			wrong with learning new things or adapting to changing circumstances. What’s wrong with style drift is that
			emotions are forming the current that’s drifts you along. Style drift is just endemic whenever the market is
			briskly valued and it’s hard to find ways to put money to work. You could argue it’s the most common reason
			highly regarded investors get blown up.</p>

		<p>Lastly, I would say that people got confused that leverage is okay in financial institutions as if they are
			exempt from the laws of leverage because of the nature of their business. That’s a mistake that people won’t
			be making again anytime soon.</p>

		<p>People were investing in companies leveraged 30x where they would never dream of considering a stock like
			that in a value portfolio in any other industry. What is very interesting is that Warren Buffett did not do
			this (by this I mean investing in these types of financial institutions).</p>

		<p>When he did finally invest, in Goldman, he bought preferred stock with mandatory interest payments and
			various forms of downside protection. It was primarily a bet on Goldman’s continued existence rather than
			its shorter or longer-term earnings trends. The $115 warrants were gravy.</p>

		<p><span style="color:orange;"> Interviewer:</span> You mention that Warren Buffett occasionally buys something
			because it’s cheap, that makes perfect sense to me. Sometimes you just have to buy something that’s okay but
			at an attractive price.</p>

		<p><span style="color:orange;"> Alice Schroeder:</span> What you’re talking about is an instinctual attraction.
			Warren Buffett has an instinctual attraction for things that are worth more than they’re selling for. He’s
			tried over the years to articulate different criteria by which other people can find these opportunities.
			But the fact is that in he has a nose for things that are more valuable than their price and vice versa.</p>

		<p>To some extent, when he describes investing or writes he is refining and explaining the rules by which his
			instinct told him to operate. If you put a dollar in front of him and say, “I will sell this to you for 50
			cents” he’s not going to say I don’t do cigar butts anymore, and I don’t see a moat there (laughter).</p>

		<p><span style="color:orange;"> Interviewer:</span> Is this instinct is innate?</p>

		<p><span style="color:orange;"> Alice Schroeder:</span> Some of it is temperamental but I also think people can
			figure it out. Clearly, some of it is mathematical, and it’s a question of being alert to it and having
			focus. There are times when nothing works. I use to say this about insurance stocks that once every decade
			you should buy all of them and once every decade you should sell all of them and the rest of the time you
			should do nothing.</p>

		<p>That’s probably true of a lot of industries, which means that doing nothing is the right answer most of the
			time. Much of the time you’re either looking for what’s cheap or waiting for that magic moment.</p>

		<p><span style="color:orange;"> Interviewer:</span> One of my friends likes to say, People’s decisions compound
			money.</p>

		<p><span style="color:orange;"> Alice Schroeder:</span> And that’s the other mistake because the price you pay
			determines your return. For example, people will take an earnings yield, expressed in cash flow versus price
			paid, on a stock that they would never consider in a normal interest rate environment. Large caps are
			supposedly cheaper now than any time in decades based on dividend yields.</p>

		<p>Yet investors who pay 18x earnings if rates are 1% on the theory that getting a very low earnings yield is
			acceptable versus treasuries might wake up disappointed. You may have to wait an awfully long time to earn
			your way out of a hole because of the price paid.</p>

		<p>Look at it this way. The economy will be struggling to eke out 2% growth for who knows how long. The average
			business cannot, on average, get 4–6% real growth in an environment like that, without some drastic change
			in relative currency values or some other unpleasant thing that resets the base. Yet all of the assumptions
			I see are based on 6–8% growth and everything else status quo.</p>

		<p>It’s safe to assume that at some point, multiples are going to decline from here to reflect the economy’s
			real growth rate.</p>

		<p>Berkshire has put 60% of its cash flow into equities so far this year. It’s an increase from zero, which
			could easily be interpreted as a portfolio repositioning, but it is not. Warren Buffett is still building
			cash. He doesn’t like bonds right now, but he likes cash. The feeling of needing to be fully invested
			obstructs a lot of money managers.</p>

		<p><span style="color:orange;"> Interviewer:</span> I think a lot of this irrationality has to do with capital
			market theories and so-called portfolio optimization. Or simply put a lack of common sense.</p>

		<p><span style="color:orange;"> Alice Schroeder:</span> When people are spending a lot of their time marketing
			themselves and their businesses and they’re not a start-up, its problematic. The greatest investors resent
			the time they spend marketing even though they have to do it. When marketing becomes the highlight of your
			day (that is to give a speech or be on television) that is a sign to be careful (of that manager).</p>

		<p><span style="color:orange;"> Interviewer:</span> It’s like winning a Nobel Prize…there is a curse attached
			(laughter).</p>

		<p><span style="color:orange;"> Alice Schroeder:</span> Sure…there is mean reversion and it’s true in any
			business. People reach a certain level and then they are not as hungry and they start to plateau. It’s more
			fun to be on television and be awarded honorary degrees and give speeches.</p>

		<p><span style="color:orange;"> Interviewer:</span> How has Warren Buffett evolved in the past years. Also, tell
			us about his moves during the financial crisis.</p>

		<p><span style="color:orange;"> Alice Schroeder:</span> After the Internet bubble, there was a point where he
			was seriously worried that he wouldn’t get another chance to make any big scores because of his age.
			Instead, he has had, since 2002, a run of the unique opportunity that was interrupted briefly by the housing
			bubble.</p>

		<p>I’ve heard some people say, “He’s in his heyday.” The market has certainly worked in his favour. But the
			gigantic anchor of capital that Berkshire has to invest means that no environment can be as good for him as
			the past. If people are following his investments, they should consider how limited his universe of possible
			ideas is compared to their own.</p>

		<p>He is being forced to accept lower returns than smaller investors simply by virtue of his market cap
			limitation. He’s given fair warning of this often enough, so it shouldn’t surprise us now. He’s often spoken
			nostalgically of how much better he could do running a smaller portfolio.</p>

		<p>Therefore, let’s invert the situation. If you are running a smaller portfolio, the stocks he owns are
			interesting to consider, but not necessarily the first place I would look for investment ideas.</p>

		<p>On a slightly different aspect of his life, I posted by the way on my blog called Cirque du Berk 2012 which
			is a proposal to move the BRK meeting to Vegas in 2012. It’s only partly, barely, tongue in cheek. Warren
			Buffett’s desire to be in the spotlight has gotten a bit stronger in recent years. He used to really shun
			publicity. The shareholder meeting has grown in proportion to his appearances on CNBC. It’s okay, he’s
			entitled to have some fun. But why not move the meeting?</p>

		<p><span style="color:orange;"> Interviewer:</span> So, Omaha is Too large?</p>

		<p><span style="color:orange;"> Alice Schroeder:</span> Yes, Omaha isn’t a big enough town anymore to handle
			this event. Its classic price-gouging; even low tier hotels are jacking up rates and requiring 3-night
			minimums. Some people are spending $2,500 to go to Omaha to stay at a Holiday Inn. The airline fares are a
			disgrace and rental cars are just as bad. The past couple of years have seen a dramatic change and it’s made
			the shareholder meeting unaffordable. I know that Warren Buffett isn’t happy about this. People are staying
			home because it costs too much to attend. You can spend 4–5 nights in Paris or Bali, all in, for what it
			costs to go to Omaha. We’re talking April in Paris vs. April in Omaha. With no disrespect to Omaha, I would
			rather go to Paris.</p>

		<p>By the way, the people of Omaha aren’t the ones doing this?—?it’s the hotel chains based elsewhere. I think
			he should move the meeting.</p>

		<p><span style="color:orange;"> Interviewer:</span> Tell us about your interests? How can people follow your
			latest endeavours? Where are things going for you?</p>

		<p><span style="color:orange;"> Alice Schroeder:</span> I’m working on a Buffet investing book. This, I’m pretty
			excited about because there is so much interesting material that I think will help people apply in practice
			the ideas that they work with on a very high level now. I also write a column approximately once a month for
			Bloomberg on whatever business topic is of interest at the time. I’ve written about Greece, BP, Wall Street.
			I’m doing public speaking. I’m doing some feature writing. I’m investing. I’m doing some non-profit work.
		</p>

		<p><span style="color:orange;"> Interviewer:</span> What motivates you?</p>

		<p><span style="color:orange;"> Alice Schroeder:</span> Curiosity. When something crosses my field of vision I
			will spend the time to figure it out and if it’s complicated and interesting enough I’ll keep figuring it
			out?—?which is why Warren Buffett was fun to study. It was delightful to write about this amazing American
			business story. Warren Buffett was the perfect subject.</p>

		<p>I’m motivated by my curiosity to uncover, analyse, and present important stories with interesting characters.
		</p>

		<p><span style="color:orange;"> Interviewer:</span> Alice Schroeder thank you for taking the time to answer my
			questions. It has been a privilege working with you. I wish you the best of health.</p>
	</div>`
  },
  {
    id: 'fund-letters',
    title: '13F Letters',
    type: 'ARTICLE',
    category: 'INVESTING',
    content: `
      <p>Last update date: 3rd June 2024</p>
      <p><a href="https://www.palmvalleycapital.com/_files/ugd/ef2f99_964bb102680b4ef8a7e58843f7c4b523.pdf">Palm Valley Capital Fund</a></p>
      <p><a href="https://east72.com.au/wp-content/uploads/2024/04/E72DT-Quarterly-Report-March-2024.pdf">East72 Dynasty Trust</a></p>
      <p><a href="https://www.artisanpartners.com/content/dam/documents/quarterly-commentary/vr/2024/1q/ARTMX-APDMX-APHMX-QCommentary-1Q24-vR.pdf">Artisan Mid Cap Fund</a></p>
      <p><a href="https://mcusercontent.com/2536952836a8f1408eed6fc6c/files/bf7526f9-acf1-1158-dc43-2121044075dc/First_Quarter_2024_Letter_to_Leaven_Partners.pdf">Leaven Partners</a></p>
      <p><a href="https://www.fmimgt.com/fmi/corp/Letters/iso_20240331.pdf">Fiduciary Management Inc.</a></p>
      <p><a href="https://headwaterscapmgmt.com/wp-content/uploads/2024/04/HCM-Q1-24-Investor-Letter.pdf">Headwaters Capital</a></p>
      <p><a href="https://www.whitebrookcapital.com/1q2024-commentary">Whitebrook Capital Partners</a></p>
      <p><a href="https://www.heartlandadvisors.com/Products/Mutual-Funds/Heartland-Mid-Cap-Value-Fund/Heartland-Mid-Cap-Value-Fund-1Q24-Portfolio-Manager-Commentary">Heartland Mid Cap Value Fund</a></p>
    `
  },
  {
    id: 'special-situations',
    title: 'Special Situations',
    type: 'ARTICLE',
    category: 'SITUATIONS',
    content: `
      <h3>Microsoft NASDAQ:MSFT</h3>
      <div style="display:flex; justify-content:space-between; border-bottom:1px solid #2a3b4c; padding: 0.5em 0;">
        <span>Current Price</span>
        <span style="color:#ffdc09;">$420.00</span>
      </div>
      <div style="display:flex; justify-content:space-between; border-bottom:1px solid #2a3b4c; padding: 0.5em 0;">
        <span>Target Price</span>
        <span style="color:#ffdc09;">$560.00+</span>
      </div>
      <div style="display:flex; justify-content:space-between; border-bottom:1px solid #2a3b4c; padding: 0.5em 0;">
        <span>P/E</span>
        <span style="color:#ffdc09;">24.5</span>
      </div>
      <p>Microsoft is a leading global technology provider, dominating commercial cloud and enterprise artificial intelligence markets.</p>
      <ul>
        <li>Fortress balance sheet with a AAA credit rating and $625B+ in commercial backlog.</li>
        <li>High-margin SaaS scaling Copilot and agentic AI across massive active install base.</li>
        <li>Azure cloud demand growing ~40% annually, acting as the primary enterprise AI pipeline.</li>
      </ul>

      <hr style="border:0; border-top:1px solid #2a3b4c; margin: 1.5em 0;">

      <h3>Nu Bank NYSE:NU</h3>
      <div style="display:flex; justify-content:space-between; border-bottom:1px solid #2a3b4c; padding: 0.5em 0;">
        <span>Current Price</span>
        <span style="color:#ffdc09;">$12.25</span>
      </div>
      <div style="display:flex; justify-content:space-between; border-bottom:1px solid #2a3b4c; padding: 0.5em 0;">
        <span>Target Price</span>
        <span style="color:#ffdc09;">$18.50+</span>
      </div>
      <div style="display:flex; justify-content:space-between; border-bottom:1px solid #2a3b4c; padding: 0.5em 0;">
        <span>P/E</span>
        <span style="color:#ffdc09;">21.4</span>
      </div>
      <p>Nu Bank (Nu Holdings) is a digitally native fintech platform disrupting legacy banking across Latin America.</p>
      <ul>
        <li>Customer acquisition cost (CAC) is just $7 (85% lower than incumbents) with a cost to serve under $0.90/month.</li>
        <li>High-margin scaling (30%+ ROE) with over 135M+ active customers and expansion into Mexico, Colombia, and the US.</li>
        <li>Highly conservative 40% loan-to-deposit ratio providing substantial untapped lending runway.</li>
      </ul>
    `
  },
  {
    id: 'compilations',
    title: 'Kevin G. Compilations',
    type: 'ARTICLE',
    category: 'RESEARCH',
    content: `<header>

			<h1>Kevin G. Compilations</h1>
		</header>


		<div class="entry-content">

			<p>&#8220;<em>nanos gigantum humeris insidentes</em>&#8221; </p>



			<p>Stan Druckenmiller once said that the best way to understand an industry is to look at every company in
				it. I’ve found that this (mostly) works for people too. To understand people, read everything they’ve
				ever published, and listen to every talk they’ve ever given.</p>

			<p><span style="text-decoration:underline">**Notes</span>:<br>&#8211; Asterisks signify compilations by
				other people<br>&#8211; Investors listed in alphabetical order by last name<br>&#8211; Unlinked names
				are works in progress</p>







			<p><span style="text-decoration:underline">**Notes</span>:<br>&#8211; Asterisks signify compilations by
				other people<br>&#8211; Investors listed in alphabetical order by last name<br>&#8211; Unlinked names
				are works in progress</p>



			<p><strong><span style="text-decoration:underline">Special Editions</span>:</strong> <br><a
					rel="noreferrer noopener" href="https://drive.google.com/open?id=1kUPFgZbNr9VZPCdP3d24LN61kxLpx3Vv"
					target="_blank">Lu Li</a>, Himalaya Capital<br><a rel="noreferrer noopener"
					href="https://drive.google.com/file/d/1Zic0ZnMovFct-sPJO-rpjg2-PCnerMo0/view?usp=sharing"
					target="_blank">Jeremy Liew</a>, Lightspeed Venture Partners<br><a
					href="https://drive.google.com/file/d/1FNcGG2Y0q8_s3V0956znTHJXxXTOrh2P/view?usp=sharing">Ho
					Nam</a>, Altos Ventures<br><a rel="noreferrer noopener"
					href="https://drive.google.com/file/d/1cWY-HUqKhr5MKBN2HZ5l5Tjv7QnkZhWx/view?usp=sharing"
					target="_blank">Sarah Tavel</a>, Benchmark/Greylock/Bessemer<br><a rel="noreferrer noopener"
					href="https://drive.google.com/open?id=1I9Ip6HSaS46600GSJIMCov_wlg-HaFf9" target="_blank">Josh
					Wolfe</a>, Lux Capital<br><a rel="noreferrer noopener"
					href="https://drive.google.com/open?id=1ldRf9JomaRsA_S-g8V6TQPkBOujO5UJ7" target="_blank">Josh
					Wolfe_Volume 2</a>, Lux Capital</p>



			<p class="has-text-align-left"><span style="text-decoration:underline"><strong>Venture
						Investors</strong></span>:<br><a rel="noreferrer noopener"
					href="https://drive.google.com/file/d/16I6XEBQLXPzSkyGrCK2xSOioPZDnOxss/view?usp=sharing"
					target="_blank">Marc Andreessen</a>, a16z/Ning/Netscape/Mosaic<br><a rel="noreferrer noopener"
					href="https://drive.google.com/open?id=1oDWZCRAamFbO7Ufsqp3405IgJf-ZV53v" target="_blank">Marc
					Andreessen &#8220;Lost Essays&#8221; Edition</a>, Netscape<br><a rel="noreferrer noopener"
					href="https://drive.google.com/open?id=17jv0liAtGY_fgXzBiMhVQltnzuhkgoxf" target="_blank">Marc
					Andreessen (official ebook)</a>*, a16z<br> <a rel="noreferrer noopener"
					href="https://drive.google.com/open?id=1Sq5din5tL3owcMA3BWKfn0XXk3ETvtAR" target="_blank">Bill
					Gurley</a>, Benchmark Capital<br><a rel="noreferrer noopener"
					href="https://drive.google.com/open?id=1jX3GbFCIlnJc4vzSf4XWYyD6RosCdKOh" target="_blank">Bill
					Gurley &#8220;Lost Essays&#8221; Edition</a>, Benchmark Capital<br><a rel="noreferrer noopener"
					href="https://drive.google.com/open?id=1iRhbOECvmm6O-Ywvtxkq2yBMPwEKHfOM" target="_blank">Ben
					Horowitz</a>*, a16z<br><a rel="noreferrer noopener"
					href="https://drive.google.com/file/d/1q1NRi42R7rs1muUjG8KwJB4fuG38Ovm4/view?usp=sharing"
					target="_blank">Steve Jurvetson</a>, Future Ventures/Draper Fisher Jurvetson<br><a
					rel="noreferrer noopener" href="https://drive.google.com/open?id=1uefKBgT5db54QggqBn_-8WLMNHNwqpf9"
					target="_blank">Vinod Khosla</a>, Khosla Ventures/Kleiner Perkins &#8212; See <span
					style="text-decoration:underline">*Notes</span>^^<br><a rel="noreferrer noopener"
					href="https://drive.google.com/file/d/1qbckQQw8LXwehhkiIAZg5hDa50-s5H5O/view?usp=sharing"
					target="_blank">Mitch Lasky</a>, Benchmark Capital<br><a
					href="https://drive.google.com/file/d/129FeQVEoBTCw5ZPu05tbaI-0QNJ8I9kJ/view?usp=sharing">Jessica
					Livingston</a>, Y Combinator<br><a rel="noreferrer noopener"
					href="https://drive.google.com/file/d/1zMY56NKDH56AHifXfRlHvMpX5zWzn-84/view?usp=sharing"
					target="_blank">Jeremy Levine</a>, Bessemer Venture Partners<br><a
					href="https://drive.google.com/file/d/1H1nHUHMaiS9yz3bdXulhdA3AwPcDefnd/view?usp=sharing">Michael
					Moritz</a>, Sequoia<br><a rel="noreferrer noopener"
					href="https://drive.google.com/file/d/1fZHmpXxvVfDRZWvGx7pcX1Xa0K_Lp0z5/view?usp=sharing"
					target="_blank">Naval Ravikant</a>, AngelList<br><a rel="noreferrer noopener"
					href="https://drive.google.com/open?id=1X47ijmpEFLeDMokXDpDEPzM4lZkyqKQ6" target="_blank">Danny
					Rimer</a>, Index Ventures<br><a rel="noreferrer noopener"
					href="https://drive.google.com/file/d/1zarOVdAKKvaEkb7mudYc0sXKSY2HS4VQ/view?usp=sharing"
					target="_blank">Chris Sacca</a>, Lowercarbon/Lowercase<br><a rel="noreferrer noopener"
					href="https://drive.google.com/file/d/13uKDZY_LxH8tIJdiDPvO3qA04rOhIUq2/view?usp=sharing"
					target="_blank">Sheel Tyle</a>, Amplo/NEA/Bessemer<br><a rel="noreferrer noopener"
					href="https://drive.google.com/file/d/1TeLx_LS-ZCkbK8eqwXfH9_4_cftiFsJL/view?usp=sharing"
					target="_blank">Peter Thiel</a>, Founders Fund<br><a rel="noreferrer noopener"
					href="https://drive.google.com/open?id=15HdeQuSGU4DJa6AapE2W4AWCMM-bIbIy" target="_blank">Don
					Valentine</a>, Sequoia Capital<br><a rel="noreferrer noopener"
					href="https://drive.google.com/open?id=1nMP4_aYFRVxj2quDKJixT98vJldfpHu1" target="_blank">Fred
					Wilson</a>*, Union Square Ventures</p>



			<p><span style="text-decoration:underline"><strong>Enterprise Operators</strong></span>:<br><a
					href="https://drive.google.com/open?id=1yLfeq1PtJohhGDJFZjzT9rq3L5z1HQgB" target="_blank"
					rel="noreferrer noopener">Jamie Dimon</a>, JP Morgan<br><a
					href="https://drive.google.com/open?id=1NCxAF6Ydbj3dDajLmZzCIQvHBJ2P9SAB" target="_blank"
					rel="noreferrer noopener">Lou Gerstner</a>, IBM<br><a
					href="https://drive.google.com/open?id=1Y79mKHh4yFjHqMMIrU3CeV4MKxIo08gD" target="_blank"
					rel="noreferrer noopener">Andy Grove and Gordon Moore</a> ft. Arthur Rock and Bob Noyce, Intel<br><a
					href="https://drive.google.com/open?id=1B2sfK5XY9uJWaoLQL1Sk4BU0zKJKawWy" target="_blank"
					rel="noreferrer noopener">John Malone</a>, Liberty Media<br>Tom Murphy, Capital Cities<br><a
					href="https://drive.google.com/open?id=1ghJXbq6CzfO842dFBnAOqG2RgB0rSlEK" target="_blank"
					rel="noreferrer noopener">Fred Smith</a> ft. Jim Barksdale, FedEx<br><a
					href="https://drive.google.com/open?id=1DQv7SuAx_FG12BCik2YoWBsFAlYPs_F6" target="_blank"
					rel="noreferrer noopener">Jack Welch</a>, General Electric<br><a
					href="https://drive.google.com/open?id=1HrXjdJvPDG89dV1uEhUlNPzyCp5cL6TY" target="_blank"
					rel="noreferrer noopener">Dieter Zetsche</a>, Daimler</p>



			<p><strong><span style="text-decoration:underline">Consumer/Retail Operators</span>:</strong><br><a
					href="https://drive.google.com/open?id=1wHpz7TS5xYBS9HbTZvcZ1hpKM2jCbBy4" target="_blank"
					rel="noreferrer noopener">Bernard Arnault</a>, LVMH<br><a
					href="https://drive.google.com/open?id=1ynTtGoVYfZUAlUF9FRNP185h-z5HRSEi" target="_blank"
					rel="noreferrer noopener">Jeff Bezos</a>, Amazon<br><a
					href="https://drive.google.com/open?id=1oKq2tb98N85OUZLCZlvjFwu-NPqbiku1" target="_blank"
					rel="noreferrer noopener">Arthur Blank and Bernie Marcus</a>, Home Depot<br><a
					href="https://drive.google.com/file/d/1PA8MI66U8GKhb0C4r13wlLw_f6MwiBOz/view?usp=sharing"
					target="_blank" rel="noreferrer noopener">Mark Cuban</a>, Dallas Mavericks/Broadcast.com<br><a
					href="https://drive.google.com/open?id=1d5YWBmyla_Ioekj6WcADL9RQx9ODCCPc" target="_blank"
					rel="noreferrer noopener">Fabrizio Freda</a> ft. Bill and Leonard Lauder, Estée Lauder<br><a
					href="https://drive.google.com/open?id=17EIQi3KpAwaGeeZaLyllPJjoxid_fl6S" target="_blank"
					rel="noreferrer noopener">Phil Knight</a>, Nike<br><a
					href="https://drive.google.com/open?id=1YhLVhL3R6lpR2pOfAkWuIh6PRWePmaxp" target="_blank"
					rel="noreferrer noopener">Indra Nooyi</a>, PepsiCo<br><a
					href="https://drive.google.com/open?id=1lqHBk_rWTCf_WHEcJm_hNcuVsnXXJndH" target="_blank"
					rel="noreferrer noopener">Howard Schultz</a>, Starbucks<br><a
					href="https://drive.google.com/open?id=1Wopdq3GOs1iOEJkZwF1erJiB7OJfbI-R" target="_blank"
					rel="noreferrer noopener">Jim Sinegal</a>, Costco Wholesale<br><a
					href="https://drive.google.com/open?id=12ZH5kYTEJkb2DM5UKPOEDlHGxgLpaSPK" target="_blank"
					rel="noreferrer noopener">Sam Walton</a>, Walmart</p>



			<p><strong><span style="text-decoration:underline">Biotech CEOs</span>:</strong> <br><a
					href="https://drive.google.com/open?id=1fMUYWaJRQOdp0FlxXfgerwI8hjYlcbcV" target="_blank"
					rel="noreferrer noopener">Arthur Levinson</a>, Genentech<br><a
					href="https://drive.google.com/open?id=1KaSeu7bcvI-XbDFmGBJUUOEFh7WnkQ9x" target="_blank"
					rel="noreferrer noopener">Lars Sorensen</a>, Novo Nordisk<br><a
					href="https://drive.google.com/open?id=11uVjR5ogArzzoVWDn8nCJ-gc5mlur0Ut" target="_blank"
					rel="noreferrer noopener">P. Roy Vagelos</a>, Merck/Regeneron</p>



			<p><span style="text-decoration:underline"><strong>Creative CEOs</strong></span>:<br><a
					href="https://drive.google.com/open?id=13qw_tDvF9YZWGcUZYtaLpFbMeBd9Gzsz" target="_blank"
					rel="noreferrer noopener">Reed Hastings</a>, Netflix<br><a
					href="https://drive.google.com/open?id=1NnbO3gEMdHmJiC4Le3g7lQoC94ej_GxY" target="_blank"
					rel="noreferrer noopener">Brian Goldner</a>, Hasbro<br><a
					href="https://drive.google.com/open?id=177vrSLOAjrQHL9euc63y8UBLkLzq9VyL" target="_blank"
					rel="noreferrer noopener">Bob Iger</a>, Disney<br><a
					href="https://drive.google.com/open?id=1cqRSq4oCROAQIElr6Sm_5hScbjBHUTxu" target="_blank"
					rel="noreferrer noopener">Steve Jobs</a>, Apple/Pixar<br></p>



			<p><span style="text-decoration:underline"><strong>Technical CEOs</strong></span>:<br><a
					href="https://drive.google.com/file/d/176TxNUJi4eM6PjPkIdfdg-xDOoljdgUW/view">Sam Altman</a>, Y
				Combinator/OpenAI<br><a href="https://drive.google.com/open?id=1hWIK-_URXKLZLf1FL_Aw4f19e3qvYu6M"
					target="_blank" rel="noreferrer noopener">Marc Benioff</a>, Salesforce<br><a
					href="https://drive.google.com/open?id=1GTVZ-K37XVyj1sO_xpdZWJmLE0hv6q27" target="_blank"
					rel="noreferrer noopener">Sergey Brin and Larry Page</a> ft. Satya Nadella, Google/Alphabet<br><a
					href="https://drive.google.com/file/d/1V4OmwzOwyCZo7KhidM4M0CLjXZk0iTer/view?usp=sharing"
					target="_blank" rel="noreferrer noopener">Morris Chang</a>, Taiwan Semiconductor<br><a
					href="https://drive.google.com/file/d/1oR_P75K3QpJkz4s7Vf3fET0ffeKp6pyw/view?usp=sharing">Michael
					Dell</a>, Dell<br><a href="https://drive.google.com/open?id=1RVK_PbfVgp7Ajr5DeuY6jfhnHtUcygwu"
					target="_blank" rel="noreferrer noopener">Jack Dorsey</a>, Square/Twitter<br><a
					href="https://drive.google.com/open?id=14VlxVPmWhNdwozaJEhuYOwmurKB2PxKW" target="_blank"
					rel="noreferrer noopener">Bill Gates</a>, Microsoft<br><a
					href="https://drive.google.com/open?id=11AoFZpDteEHEQlmcdOuiezsnUv7LoyV1" target="_blank"
					rel="noreferrer noopener">Jensen Huang</a>, Nvidia<br><a
					href="https://drive.google.com/open?id=1EF7lmtjCFD4_g0wlc9dZV4BPFX20WXEH" target="_blank"
					rel="noreferrer noopener">Elon Musk</a>, SpaceX/Tesla/Hyperloop/Neuralink<br><a
					href="https://drive.google.com/open?id=1vRAxAnZXUMTbtoCVh7iZFZCT1f2fZ_MG" target="_blank"
					rel="noreferrer noopener">Pierre Omidyar</a> ft. Meg Whitman and John Donahoe, eBay<br></p>



			<p><strong><span style="text-decoration:underline">China Operators</span></strong><br><a
					href="https://drive.google.com/open?id=1N-419Uv3H2o-vfVhnRi7VIPzBVa4RNNC" target="_blank"
					rel="noreferrer noopener">Huateng (Pony) Ma</a>, Tencent<br><a
					href="https://drive.google.com/open?id=1HZpAN_zMSbdZQ0A3pJBer7nNEDfEvCyq" target="_blank"
					rel="noreferrer noopener">Yun (Jack) Ma</a> ft. David Wei and Daniel Zhang, Alibaba<br></p>



			<p><span style="text-decoration:underline"><strong>Private Equity Investors</strong></span>:<br><a
					href="https://drive.google.com/open?id=1TJhKHkUJ0dGnxyJ9VZu82RohX0mK0_1n" target="_blank"
					rel="noreferrer noopener">Mark Leonard (Letters)</a>, Constellation Software<br><a
					href="https://drive.google.com/open?id=1OJzDu7xdEMrgjUTASJ49oNyqVu9MNNUg" target="_blank"
					rel="noreferrer noopener">Stephen Schwarzman</a>, Blackstone Group</p>



			<p><span style="text-decoration:underline"><strong>Value Investors</strong></span>:<br><a
					href="https://12mv2.com/wp-content/uploads/2023/05/web_v31.pdf" target="_blank"
					rel="noreferrer noopener">Warren Buffett</a>, Berkshire Hathaway<br><a rel="noreferrer noopener"
					href="https://drive.google.com/open?id=1cUGObgO_L6vEXFWGJjtpbAMvvCw3AagZ" target="_blank">Michael
					Burry</a>*, Scion Capital<br><a rel="noreferrer noopener"
					href="https://drive.google.com/open?id=1HaFKV3GKKEm3_gKubpvWEmC8ygokuyMQ" target="_blank">Joel
					Greenblatt</a>*, Gotham Funds<br><a rel="noreferrer noopener"
					href="https://drive.google.com/open?id=13Ja6CKbw7iadVhp05mTEkOta-AMh_Dgz" target="_blank">Bruce
					Greenwald</a>*, Columbia University<br><a rel="noreferrer noopener"
					href="https://drive.google.com/open?id=1oZVIJpKTKB42-aFLXGrBc-IfJ-p7lEWA" target="_blank">Seth
					Klarman</a>*, Baupost Group<br><a rel="noreferrer noopener"
					href="https://12mv2.com/wp-content/uploads/2020/09/pl_fortworthcollection.pdf" target="_blank">Peter
					Lynch</a>*, Fidelity<br><span style="text-decoration:underline"><a rel="noreferrer noopener"
						href="https://drive.google.com/open?id=1A5MgVfMXnK7uJw1pnPAcTRSSNEVRD46D" target="_blank">Howard
						Marks</a></span>, Oaktree Capital<br><a rel="noreferrer noopener"
					href="https://drive.google.com/file/d/1Z1vpYay_HuePdCpOxI_Ozatv_L7-e66n/view?usp=sharing"
					target="_blank">Michael Mauboussin</a>, Counterpoint Global/Credit Suisse<br><a
					href="https://drive.google.com/file/d/1kwntlqJAK0H1LtE6wmhcW9pDZ2NtT_cc/view?usp=sharing">Bill
					Miller</a>, Miller Value Partners/Legg Mason Capital<br><a rel="noreferrer noopener"
					href="https://drive.google.com/open?id=1FRaJyT54BwkMBPkX0loHHZHC43vli5y1" target="_blank">Charlie
					Munger</a>*, Berkshire Hathaway</p>



			<p><strong><span style="text-decoration:underline">Activist Investors</span></strong>:<br><a
					rel="noreferrer noopener"
					href="https://drive.google.com/file/d/1yosAn0lruyHcVuUXjarFROvf_5X_Hkqg/view?usp=sharing"
					target="_blank">Bill Ackman</a>, Pershing Square Capital<br><a rel="noreferrer noopener"
					href="https://drive.google.com/open?id=1Q338P5ZV3Ev-hhB5vM8tCIeqVpPMtDmR" target="_blank">Carl
					Icahn</a>, Icahn Enterprises<br><a rel="noreferrer noopener"
					href="https://drive.google.com/open?id=163MAA54sjCMM3p1o4UqM1H4ehaM0OfXY" target="_blank">Dan
					Loeb</a>, Third Point Capital<br><a
					href="https://drive.google.com/file/d/1_eC26LfL7nFcuWnqhUQpDCfQPYFsYBjE/view?usp=drive_link">Yahoo!
					Activism (Carl Icahn, Dan Loeb, Jeff Smith, David Sambur, Eric Jackson)</a></p>



			<p><span style="text-decoration:underline"><strong>Macro Traders</strong></span>:<br><a
					href="https://drive.google.com/file/d/1PM6ueJsfVgnHcPkUi1zsDVNqyAp0FT2j/view?usp=sharing"
					target="_blank" rel="noreferrer noopener">George Soros</a>, Soros Fund Management/Quantum Fund<br>
			</p>



			<p><strong><span style="text-decoration:underline">Growth Equity Investors</span></strong>:<br><a
					rel="noreferrer noopener"
					href="https://drive.google.com/file/d/1TyHZl_I1EfLmrwkrjHO_XcD6MwWPlKJT/view?usp=sharing"
					target="_blank">Mary Meeker</a>, Bond Capital/Kleiner Perkins</p>



			<p class="has-text-align-left"><strong><span style="text-decoration:underline">COVID-19
						Coverage</span></strong>:<br><a rel="noreferrer noopener"
					href="https://drive.google.com/open?id=17xK7shMemYayzUayhrZ19cX72rAkO9oM" target="_blank">Corona
					Memos</a>, Sequoia/Lux/First Round/a16z/Oaktree/Pershing
				Square/Citadel/Elliott/JPM/AMZN/NFLX/PDD/USV/NEA/Mayfield/Bond</p>



			<p><strong><span style="text-decoration:underline">Graduation Speeches</span></strong>:<br><a
					rel="noreferrer noopener"
					href="https://drive.google.com/file/d/1va1j76NRdpgSy6mnEcYFi3Vc3Gt-jyvD/view?usp=sharing"
					target="_blank">Dear Graduates&#8230;</a>, Einstein/Feynman/Chomsky/Norvig/Wilson/Brodsky/Watterson/
				Morrison/DFW/Palmer/Dell/Jobs/Gates/Bezos/Musk/Munger/PTJ/Jurvetson/Thiel/
				Smith/O&#8217;Brien/Sorkin/Whedon/Rhimes/Spielberg/FDR/Eisenhower/JFK/Reagan/ Obama</p>



			<p><strong><span style="text-decoration:underline">Crypto</span></strong>:<br><a rel="noreferrer noopener"
					href="https://drive.google.com/open?id=1QpE-YsPkCPDYCAK3pwoMeSg4PZWw-ZwV" target="_blank">Intro to
					Bitcoin</a>, Balaji/Satoshi/Huang/Rast/Nielsen/Wence/Andreessen/PTJ/ Pfeffer/Taleb/Naval/Green/Wolfe
			</p>



			<p><strong><span style="text-decoration:underline">Miscellaneous</span>:</strong><br><a
					href="https://drive.google.com/open?id=13YpcGxs3srhxSEII8Dcd0t7_KLYOywHl" target="_blank"
					rel="noreferrer noopener">US vs. IBM</a>, Antitrust Lawsuit<br>Tech (GOOG/AMZN/AAPL/FB) Antitrust
				Hearings, Pichai/Bezos/Cook/Zuckerberg</p>




		</div>`
  },
  {
    id: 'us-stocks',
    title: 'US Stock Ideas',
    type: 'ARTICLE',
    category: 'US',
    content: ''
  }
];
