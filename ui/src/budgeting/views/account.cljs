(ns budgeting.views.account
  (:require
    [reagent.core :as r]
    [re-frame.core :as re-frame]
    [spade.core :refer [defclass]]
    [moment :as moment]
    [central :as central]
    [budgeting.events :as events]
    [budgeting.subs :as subs]))

(defclass table-style []
  {:width "100%"
   :border-collapse "collapse"})
(defn table [& children] (into [:table {:class (table-style)}] children))

(defclass header-cell-style []
  {:text-align "left"
   :border (str "1px solid" central/Constants.colors.black)
   :border-right "0px"
   :padding-left "6px"
   :padding-right "6px"
   :padding-top "9px"
   :padding-bottom "9px"
   :background-color central/Constants.colors.lightGray})
(defn header-cell [& children] (into [:th {:class (header-cell-style)}] children))

(defclass row-style []
  {:border (str "1px solid" central/Constants.colors.black)
   :border-right "0px"})
(defn row [attrs & children] (into [:tr (merge-with + {:class (row-style)} attrs)] children))

(defclass cell-style []
  {:text-align "left"
   :padding-left "6px"
   :padding-right "6px"
   :padding-top "5px"
   :padding-bottom "5px"})
(defn cell [attrs & children] (into [:td (merge-with + {:class (cell-style)} attrs)] children))

(defclass number-cell-style []
  {:text-align "right"
   :padding-left "6px"
   :padding-right "6px"
   :padding-top "5px"
   :padding-bottom "5px"})
(defn number-cell [attrs & children] (into [:td (merge-with + {:class (number-cell-style)} attrs)] children))

(defn build [account]
  (letfn [(render-transaction [transaction]
            (let [inflow (if (>= (:amount transaction) 0) (str "$" (:amount transaction)) "")
                  outflow (if (< (:amount transaction) 0) (str "$" (* -1 (:amount transaction))) "")]
              [row {:key (:id transaction)}
                [cell {:style {:width "20%"}} (-> transaction :authorizedAt moment (.format "MM/DD/YYYY"))]
                [cell {:style {:width "50%"}} (:merchantName transaction)]
                [number-cell {:style {:width "15%"}} outflow]
                [number-cell {:style {:width "15%"}} inflow]]))]
         [table
           [:thead [row {} [header-cell "Date"] [header-cell "Payee"] [header-cell "Outflow"] [header-cell "Inflow"]]]
           [:tbody
             (map render-transaction (:transactions account))]]))