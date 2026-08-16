;; nse-plain-english.clj — Tier 2 enrichment: curated sectors + layman blurbs + startHere.
;; NOT idempotent-by-design; operating procedure: restore pristine → run once.
;; Backup guarded: refuses to overwrite an existing backup (rerun protection).
(ns nse-plain
  (:require [cheshire.core :as json]
            [clojure.java.io :as io]
            [clojure.string :as str]))

(def repo (System/getenv "MOECAP_REPO"))
(def proj (System/getenv "PROJ"))

(when (or (nil? repo) (nil? proj))
  (throw (ex-info "Set MOECAP_REPO and PROJ env vars" {})))

(def data-path (str repo "/data/nse-data.json"))
(def backup-path (str proj "/nse-data.pre-tier2.json"))

;; --- curated sectors: replaces "Other"/"Unknown" only where confident ---
(def sector-overrides
  {"ALP" "Funds & REITs"      "AMAC" "Agricultural"          "ARM" "Manufacturing & Allied"
   "BKG" "Banking"            "CABL" "Manufacturing & Allied" "CGEN" "Commercial & Services"
   "CRWN" "Manufacturing & Allied" "DCON" "Commercial & Services" "EVRD" "Manufacturing & Allied"
   "FMLY" "Banking"           "GLD" "Funds & REITs"          "HBE" "Commercial & Services"
   "KAPC" "Agricultural"      "KPC" "Energy & Petroleum"     "KURV" "Investment"
   "LAPR" "Funds & REITs"     "LBTY" "Insurance"             "LIMT" "Agricultural"
   "OCH" "Investment"         "SGL" "Commercial & Services"  "SLAM" "Insurance"
   "SMER" "Manufacturing & Allied" "SMWF" "Funds & REITs"    "TCL" "Investment"
   "TRFC" "Funds & REITs"     "UCHM" "Commercial & Services" "UMME" "Energy & Petroleum"})

;; --- layman one-liners: what they do + how they make money.
;; --- authored from company identity; omitted where identity is not confident. ---
(def blurbs
  {"SCOM" "Kenya's biggest mobile network. Makes money from calls, data and M-PESA mobile money."
   "KCB" "One of Kenya's largest banks. Earns interest on loans and fees on banking services."
   "EQTY" "Banking group serving Kenya and six other African countries. Interest and fees on loans."
   "COOP" "Bank built around the co-operative movement — farmer and Sacco banking plus normal retail banking."
   "ABSA" "Retail and business bank in Kenya, part of South Africa's Absa group."
   "NCBA" "Bank formed from NIC and CBA. Known for asset finance and the Loop digital bank."
   "SBIC" "Kenyan arm of Standard Bank (Stanbic). Retail and corporate banking."
   "SCBK" "Kenyan arm of Standard Chartered. Corporate and retail banking."
   "DTK" "Bank focused on trade finance and business lending across East Africa."
   "IMH" "Banking group running I&M Bank in Kenya plus banks in Rwanda, Tanzania and Uganda."
   "FMLY" "Mid-sized Kenyan retail bank."
   "HFCB" "Bank and mortgage lender (HF Group). Home loans plus normal banking."
   "BKG" "Parent of Bank of Kigali, Rwanda's largest bank. Cross-listed in Nairobi."
   "EABL" "Makes beer and spirits — Tusker, Guinness and Johnnie Walker for East Africa."
   "BAT" "Makes and sells cigarettes in Kenya (Sportsman, Dunhill)."
   "BAMB" "Makes cement for building. Also runs tree plantations and power lines as side businesses."
   "PORT" "State-controlled cement maker — the other big cement producer after Bamburi."
   "ARM" "Cement and lime maker. Has been under administration since 2018 — check status before acting."
   "UNGA" "Makes flour and animal feeds — the ugali-flour business."
   "MSC" "Sugar grower and miller. Long-struggling: repeated losses and bailouts."
   "CARB" "Harvests industrial carbon dioxide gas for drinks and industry."
   "BOC" "Supplies industrial and medical gases — oxygen, nitrogen and the like."
   "FTGH" "Makes hair and beauty products, medicines and home goods for East Africa."
   "CRWN" "Makes paint (Duracoat) for homes and industry."
   "CABL" "Makes electrical cables. Has struggled financially in recent years."
   "EVRD" "Made batteries and torches. Largely wound down — very small company."
   "SMER" "Industrial group: tyres, cables and property."
   "TCL" "Investment holding company with stakes in infrastructure and engineering businesses."
   "KEGN" "Generates most of Kenya's electricity from geothermal steam at Olkaria."
   "KPLC" "Buys power from generators and delivers it to your meter — the electricity-bill company."
   "TOTL" "Runs fuel stations — petrol, diesel and lubricants (TotalEnergies Kenya)."
   "UMME" "Uganda's electricity distributor, cross-listed in Nairobi."
   "JUB" "Insurance company: life, health and general cover across East Africa."
   "BRIT" "Insurance and asset-management group (Britam)."
   "CIC" "Co-operative insurer — general and life insurance, strong in farm cover."
   "KNRE" "State-backed reinsurer — insures the insurance companies."
   "LBTY" "Insurance group (Liberty Kenya): short-term and life cover plus investments."
   "KQ" "Kenya's national airline. Flies passengers and cargo; majority state-owned and loss-prone."
   "NMG" "Publisher of the Daily Nation newspaper and nation.africa."
   "SGL" "Publisher of The Standard newspaper and KTN television."
   "SCAN" "Advertising and marketing group — Ogilvy Africa's parent (WPP Scangroup)."
   "LKL" "Publishes school textbooks (Longhorn)."
   "TPSE" "Runs the Serena hotels and tourism lodges."
   "XPRS" "Courier and logistics company."
   "CGEN" "Sells and services cars, motorbikes and generators (Car & General)."
   "DCON" "Clothing retailer. Struggling — most stores closed over the years."
   "UCHM" "Supermarket chain, shrunk heavily after financial troubles."
   "HBE" "Radio station and events company (Homeboyz)."
   "KUKZ" "Grows avocados, macadamia nuts and pineapples, and raises cattle for export."
   "SASN" "Grows tea and coffee and keeps dairy cattle — export agriculture."
   "WTK" "Tea grower with large estates (linked to Finlays)."
   "KAPC" "Small tea-growing company."
   "CTUM" "Invests in companies and property (Centum) — aims to buy cheap, grow, then sell."
   "NSE" "Runs the Nairobi Securities Exchange — the marketplace this page shows."
   "OCH" "Small investment company with property interests."
   "KURV" "Small Sharia-compliant (halal) investment company."
   "KPC" "State-owned oil pipeline company. Not traded on the NSE — treat any data with caution."
   "ALP" "Property fund investing in income-producing real estate (a REIT)."
   "GLD" "Fund that tracks the gold price — a way to own gold without a vault."
   "SMWF" "Fund tracking world stock markets (Satrix MSCI World feeder ETF)."
   "LAPR" "REIT earning rent from properties leased to government (Laptrust Imara)."
   "TRFC" "US-dollar green REIT — income from renewable-energy property."
   "HAFR" "Small property developer (share long suspended)."})

(def start-here ["SCOM" "KCB" "EABL" "EQTY"])

(defn -main [& _]
  ;; backup guard
  (if (.exists (io/file backup-path))
    (println "backup exists — refusing to overwrite:" backup-path)
    (io/copy (io/file data-path) (io/file backup-path)))
  (let [db (json/parse-string (slurp data-path) true)
        companies (mapv (fn [c]
                          (let [t (:ticker c)]
                            (cond-> c
                              (and (contains? sector-overrides t)
                                   (#{"Other" "Unknown"} (:sector c)))
                              (assoc :sector (get sector-overrides t))
                              (contains? blurbs t)
                              (assoc :blurb (get blurbs t)))))
                        (:companies db))
        out (-> db
                (assoc :companies companies)
                (assoc :startHere start-here))]
    (spit data-path (json/generate-string out {:pretty true}))
    (let [sector-count (frequencies (map :sector companies))
          blurred (count (filter :blurb companies))]
      (println "companies:" (count companies))
      (println "blurbs:" blurred)
      (println "startHere:" (pr-str start-here))
      (println "sectors:" (sort-by val > sector-count)))))

(-main)
