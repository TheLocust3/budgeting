(ns budgeting.views.account
  (:require
    [clojure.string :as string]
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

(defclass right-cell-style []
  {:text-align "right"
   :padding-left "6px"
   :padding-right "6px"
   :padding-top "5px"
   :padding-bottom "5px"})
(defn right-cell [attrs & children] (into [:td (merge-with + {:class (right-cell-style)} attrs)] children))

(defclass delete-cell-style []
  {:text-align "center"
   :padding-left "6px"
   :padding-right "6px"
   :padding-top "5px"})
(defn delete-cell [attrs & children] (into [:td (merge-with + {:class (delete-cell-style)} attrs)] children))

(defclass delete-style []
  {:cursor "pointer"
   :color central/Constants.colors.black}
  [:&:hover {:color central/Constants.colors.red}])
(defn delete [attrs & children] (into [:div (merge-with + attrs {:class (delete-style)})] children))

(defclass edit-style []
  {:cursor "pointer"
   :color central/Constants.colors.black}
  [:&:hover {:color "#4fa2ef"}])
(defn edit [attrs & children] (into [:div (merge-with + attrs {:class (edit-style)})] children))

(defn build [account attrs]
  (letfn [(render-transaction [transaction]
            (let [inflow (if (>= (:amount transaction) 0) (str "$" (:amount transaction)) "")
                  outflow (if (< (:amount transaction) 0) (str "$" (* -1 (:amount transaction))) "")
                  rule @(re-frame/subscribe [::subs/rule-for (:id transaction)])
                  buckets (map (fn [bucket] (:name @(re-frame/subscribe [::subs/bucket (:id bucket)]))) (:splits (:rule rule)))
                  remainder (:name @(re-frame/subscribe [::subs/bucket (:remainder (:rule rule))]))]
              [row {:key (:id transaction)}
                [cell {:style {:width "15%"}} (-> transaction :authorizedAt moment (.format "MM/DD/YYYY"))]
                [cell {:style {:width "30%"}} (:merchantName transaction)]
                [cell {:style {:width "25%"}} (string/join ", " (conj buckets remainder))]
                [right-cell {:style {:width "10%"}} outflow]
                [right-cell {:style {:width "10%"}} inflow]
                (if (not (nil? (:on-edit-transaction attrs)))
                    [delete-cell
                      {:style {:width "2.5%"}}
                      [edit
                        {:on-click (fn [e] (.stopPropagation e) ((:on-edit-transaction attrs) transaction))}
                        [:> central/Icon {:icon "edit" :size "0.95em"}]]])
                (if (not (nil? (:on-delete-transaction attrs)))
                    [delete-cell
                      {:style {:width "2.5%"}}
                      [delete
                        {:on-click #((:on-delete-transaction attrs) (:id transaction))}
                        [:> central/Icon {:icon "delete" :size "0.95em"}]]])]))]
         [table
           [:thead [row
                     {}
                     [header-cell "Date"]
                     [header-cell "Payee"]
                     [header-cell "Bucket"]
                     [header-cell "Outflow"]
                     [header-cell "Inflow"]
                     (if (not (nil? (:on-edit-transaction attrs))) [header-cell])
                     (if (not (nil? (:on-delete-transaction attrs))) [header-cell])]]
           [:tbody
             (doall (map render-transaction (:transactions account)))]]))
