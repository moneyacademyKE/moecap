;; update-aib.clj — inject AIB-AXYS analyst-verified FY2025 + Crown Paints H1'26 into nse-data.json
;; Facts extracted from earnings notes (research use). All money in KES millions.
;; Run: bb update-aib.clj  (from ~/Desktop/moecap)
(ns update-aib
  (:require [cheshire.core :as json]
            [clojure.string :as str]
            [clojure.walk :as walk]))

(def DATA "data/nse-data.json")
(def BAK "data/nse-data.pre-aib.json")

;; ticker -> FY2025 fields (KES Mn). nil = not stated in note.
(def fy25
  {"KCB"  {"Profit after Tax" 68351.2 "Core EPS" 20.8
           "Total Assets" 2147206.6 "Shareholders Funds" 331466.8}
   "EQTY" {"Net Interest Income" 126940 "Non-Interest Income" 90800
           "Profit before Tax" 92110 "Profit after Tax" 75550
           "Core EPS" 19.07 "DPS" 5.75 "Total Assets" 1971160}
   "COOP" {"Profit after Tax" 29750 "DPS" 2.5
           "Total Assets" 827350 "Shareholders Funds" 165470}
   "ABSA" {"Profit after Tax" 22910 "DPS" 2.05
           "Total Assets" 537650 "Shareholders Funds" 100520}
   "NCBA" {"Profit after Tax" 23390 "DPS" 7.1
           "Total Assets" 716050 "Shareholders Funds" 127450}
   "SBIC" {"Profit after Tax" 13720 "Core EPS" 34.7 "DPS" 22.35
           "Total Assets" 541250}
   "SCBK" {"Profit after Tax" 12436.57 "Core EPS" 32.99 "DPS" 31.0
           "Total Assets" 363491.56 "Shareholders Funds" 66320.18}
   "IMH"  {"Profit after Tax" 19837.1 "Core EPS" 10.79 "DPS" 3.75
           "Total Assets" 668884 "Shareholders Funds" 115161}
   "DTK"  {"Profit after Tax" 10710 "DPS" 9.0
           "Total Assets" 659120 "Shareholders Funds" 101100}
   "BAT"  {"Profit after Tax" 5250 "DPS" 70.0 "Shareholders Funds" 15490}})

;; Crown Paints: H1 2026 headline + 12-year net-profit series (NSE PLC tweet chart)
(def crown-h1-2026 {"Revenue" 8380 "Profit before Tax" 688 "Profit after Tax" 486})
(def crown-series
  {"2015" 25.1 "2016" 39.9 "2017" 60.5 "2018" 40.7 "2019" 29.2
   "2020" 252.8 "2021" 340.0 "2022" 288.0 "2023" 37.0
   "2024" 75.0 "2025" 437.0 "2026" 486.0})

(defn -main [& _]
  (let [doc   (json/parse-string (slurp DATA)) ;; string keys throughout
        _     (spit BAK (slurp DATA))
        fin   (get doc "financials")
        ;; FY2025 injections
        fin   (reduce (fn [acc [tk fields]]
                        (if (get acc tk)
                          (-> acc
                              (assoc-in [tk "metrics" "FY2025"] fields)
                              (assoc-in [tk "canonicalYear"] "FY2025")
                              (assoc-in [tk "source"] "audited"))
                          acc))
                      fin fy25)
        ;; Crown Paints
        fin   (if (get fin "CRWN")
                (let [with-h1 (assoc-in fin ["CRWN" "metrics" "H1 2026"] crown-h1-2026)
                      with-s  (reduce (fn [acc [yr np]]
                                        (update-in acc ["CRWN" "metrics" yr]
                                                   #(assoc (or % {}) "Net Profit" np)))
                                      with-h1 crown-series)]
                  (-> with-s
                      (assoc-in ["CRWN" "canonicalYear"] "H1 2026")
                      (assoc-in ["CRWN" "source"] "audited")))
                fin)]
    (spit DATA (json/generate-string (assoc doc "financials" fin)))
    (let [check (json/parse-string (slurp DATA))]
      (println "KCB FY2025 PAT:" (get-in check ["financials" "KCB" "metrics" "FY2025" "Profit after Tax"]))
      (println "KCB canonical:" (get-in check ["financials" "KCB" "canonicalYear"]))
      (println "CRWN canonical:" (get-in check ["financials" "CRWN" "canonicalYear"]))
      (println "CRWN 2025 NP:" (get-in check ["financials" "CRWN" "metrics" "2025" "Net Profit"]))
      (println "EQTY canonical:" (get-in check ["financials" "EQTY" "canonicalYear"])))))

(-main)
