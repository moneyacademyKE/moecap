;; Tier 1 normalizer for data/nse-data.json.
;; NOT idempotent: run against a pristine copy (restore from git, then run once).
;; - companies := live kwayisi directory (69), sectors carried via old codes + aliases
;; - financials: alias renames (IM->IMH, KURW->KURV, HF->HFCB, KAPU->KAPC, BK->BKG);
;;   dead keys archived to $MOECAP_PROJ/nse-financials-dead.json
;; - canonical-year design: per company the FULLEST money year is cleaned
;;   (year-leak nulls incl x1000/x1e6 variants, 3-decade bin majority,
;;   TA>=TE pairwise rule) and recorded as canonicalYear; other years stay raw
;; - Revenue derived where >=2 income lines exist (banks: II+IE)
;; - ratios: fraction values x100 -> single percent convention
;; - unitHint per company (K/M/B native unit) drives display
;; - pristine backup only if absent; dead archive only when non-empty
(ns nse-norm
  (:require [cheshire.core :as json]
            [clojure.string :as str]))

(def REPO (System/getenv "MOECAP_REPO"))
(def DATA (str REPO "/data/nse-data.json"))
(def LIVE "/tmp/nse-live-list.txt")
(def ARCHIVE (System/getenv "MOECAP_PROJ"))

(def aliases {:IM :IMH :KURW :KURV :HF :HFCB :KAPU :KAPC :BK :BKG})
(def dead-keys (map keyword ["ACORN" "BOND" "FAHR" "KMRC" "NBK" "PAX" "SHAF" "UAP"]))

(def money-probe-fields ["Total Assets" "Total Debt" "Share Capital" "Intangible Assets"
                         "Retained Earnings" "Revenue" "Cash & Bank" "Total Equity"])
(def ratio-capable #{"Core Capital" "Total Risk Weighted Assets" "Liquidity Ratio %"})

(defn num? [v] (and (number? v) (not (Double/isNaN v))))

(defn parse-live []
  (->> (slurp LIVE)
       str/split-lines
       (map #(str/split % #"\|" 2))
       (map (fn [[t n]] {:ticker t :name (-> n (str/replace "&amp;" "&") str/trim)}))
       (sort-by :ticker)))

(defn load-data [] (json/parse-string (slurp DATA) true))

(defn year-leak? [year v]
  (and (num? v)
       (let [y (parse-double (name year))]
         (boolean (some (fn [cand] (<= (abs (- cand y)) 0.5))
                        [v (* v 1000.0) (* v 1000000.0)])))))

(def junk-cap 1e8) ; 100T KES — nothing legitimate is above

(defn probe-stats [year-map]
  (let [vals (->> (keep #(get year-map (keyword %)) money-probe-fields)
                  (filter #(and (num? %) (pos? %) (< % 1e7)))
                  sort)]
    [(count vals) (when (seq vals) (nth vals (quot (count vals) 2)))]))

(defn null-leaks [y fields]
  (into {} (map (fn [[f v]] [f (if (year-leak? y v) nil v)]) fields)))

;; v9 design: cross-year unit unification is NOT attempted (source mixes
;; 3 native units + ratios-in-money + junk; year-level heuristics can't win).
;; Instead: every year gets leak-nulls; the CANONICAL year (fullest money
;; year) additionally gets within-year junk rules. Multi-year trends are
;; carried by unit-free ratios, not absolute money.
;; v10 final rule: within the canonical year, money values cluster into
;; 3-decade bins (thousands / millions / billions). The majority bin is the
;; year's native unit; minority-bin values are nulled (honest emptiness).
(defn bin-of [v] (Math/floor (/ (Math/log10 (max (Math/abs (double v)) 1e-9)) 3.0)))

(defn clean-canonical-year [fields]
  (let [bins (->> fields
                  (keep (fn [[f v]]
                          (when (and (num? v) (not (zero? v))
                                     (not (contains? ratio-capable (name f))))
                            (bin-of v))))
                  frequencies)
        best (when (seq bins)
               (let [mx (apply max (vals bins))]
                 (set (keep (fn [[b c]] (when (= c mx) b)) bins))))
        base (if (nil? best)
               fields
               (into {} (map (fn [[f v]]
                               (if (or (contains? ratio-capable (name f))
                                       (nil? v) (not (num? v)) (zero? v))
                                 [f v]
                                 (if (or (> (abs v) junk-cap) (contains? best (bin-of v)))
                                   [f v] [f nil])))
                             fields)))
        money-vals (keep (fn [[f v]] (when (and (num? v) (not (zero? v))
                                                (not (contains? ratio-capable (name f))))
                                      v))
                         base)
        neighbors (fn [x] (count (filter (fn [w] (<= (max x w) (* 10.0 (min x w))))
                                         money-vals)))
        ta (get base (keyword "Total Assets"))
        te (get base (keyword "Total Equity"))]
    (if (and (num? ta) (num? te) (< ta te) (pos? te))
      (if (<= (neighbors ta) (neighbors te))
        (assoc base (keyword "Total Assets") nil)
        (assoc base (keyword "Total Equity") nil))
      base)))

(defn scale-tiny-ratios [fields]
  (into {} (map (fn [[f v]]
                  (if (and (contains? ratio-capable (name f)) (num? v) (< (abs v) 0.01))
                    [f (* v 1000000.0)]
                    [f v]))
                fields)))

(defn canonical-year [metrics]
  (let [cleaned (zipmap (keys metrics) (map null-leaks (keys metrics) (vals metrics)))
        ks (keys cleaned)]
    (when (seq ks)
      (let [score (fn [y] (let [[c m] (probe-stats (get cleaned y))]
                            (+ (* c 1e12) (or m 0.0))))]
        (reduce (fn [a b] (if (> (score b) (score a)) b a)) ks)))))

(defn normalize-metrics [metrics]
  (let [cleaned (zipmap (keys metrics) (map null-leaks (keys metrics) (vals metrics)))
        ks (keys cleaned)
        canon (canonical-year metrics)]
    (zipmap ks
            (map (fn [y fields]
                   (if (= y canon)
                     (-> fields clean-canonical-year scale-tiny-ratios)
                     fields))
                 ks (vals cleaned)))))
                        "M-PESA Revenue" "Mobile Data Revenue" "Voice Revenue"
(def income-components ["Interest Income" "Interest Expense" "Operating Income"
                        "M-PESA Revenue" "Mobile Data Revenue" "Voice Revenue"
                        "Gross Earned Premiums"])
(defn derive-revenue [metrics]
  (into {}
        (for [[y fields] metrics]
          (let [rev (get fields :Revenue)
                parts (keep #(get fields (keyword %)) income-components)]
            (if (and (or (nil? rev) (not (num? rev)))
                     (>= (count parts) 2)
                     (every? num? parts)
                     (> (reduce + parts) 0))
              [y (assoc fields :Revenue (reduce + parts))]
              [y fields])))))

(defn normalize-ratios [ratios]
  (into {}
        (for [[y fields] ratios]
          [y (into {}
                   (for [[f v] fields]
                     [f (if (and (num? v) (> v 0) (< v 1)) (* v 100.0) v)]))])))

;; only the KES-thousands reporters need hand-curation; everything else
;; derives from the canonical year's majority magnitude (>=1000 => millions)
(def thousands-reporters #{"FTGH" "EGAD"})
(def millions-exceptions #{"NSE"}) ; small caps whose canonical values sit < 1000 but are millions-native

(defn unit-hint-for [k metrics]
  (let [cy (canonical-year metrics)
        [_ m] (when cy (probe-stats (get metrics (keyword cy))))]
    (cond
      (contains? thousands-reporters (name k)) "K"
      (contains? millions-exceptions (name k)) "M"
      (and m (>= m 1000)) "M"
      :else "B")))

(defn -main [& _]
  (let [data (load-data)
        live (parse-live)
        old-companies (into {} (map (juxt :ticker identity) (:companies data)))
        sector-of (fn [t]
                    (or (get-in old-companies [t :sector])
                        (some (fn [[old new]]
                                (when (= (name new) t)
                                  (get-in old-companies [(name old) :sector])))
                              (concat aliases [[:FIRE :FTGH] [:BK :BKG]
                                               [:FAMB :FMLY] [:HFCK :HFCB]]))
                        "Other"))
        fin0 (:financials data)
        fin1 (reduce (fn [m [old new]]
                       (if (and (contains? m old) (not (contains? m new)))
                         (assoc (dissoc m old) new (get m old))
                         m))
                     fin0 aliases)
        dead (select-keys fin1 dead-keys)
        fin2 (apply dissoc fin1 dead-keys)
        fin3 (into {}
                   (for [[k v] fin2]
                     (let [metrics (-> (:metrics v {}) normalize-metrics derive-revenue)]
                       [k (assoc v :metrics metrics
                                   :canonicalYear (canonical-year metrics)
                                   :unitHint (unit-hint-for k metrics)
                                   :ratios (normalize-ratios (:ratios v {})))])))
        companies (mapv (fn [{:keys [ticker name]}]
                          {:ticker ticker :name name :sector (sector-of ticker)}) live)
        out (assoc data :companies companies :financials fin3)]
    (let [bak (str ARCHIVE "/nse-data.pre-tier1.json")]
      (when-not (.exists (java.io.File. bak))
        (spit bak (json/generate-string data {:pretty true}))))
    (when (seq dead)
      (spit (str ARCHIVE "/nse-financials-dead.json") (json/generate-string dead {:pretty true})))
    (spit DATA (json/generate-string out {:pretty true}))
    (println "companies:" (count companies)
             "| financials:" (count fin3)
             "| archived-dead:" (count dead))))

(-main)