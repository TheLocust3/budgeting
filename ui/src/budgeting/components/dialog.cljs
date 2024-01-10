(ns budgeting.components.dialog
  (:require
    [reagent.core :as r]
    [re-frame.core :as re-frame]
    [spade.core :refer [defclass]]
    [central :as central]
    [budgeting.subs :as subs]
    [budgeting.events :as events]))

(defclass floating-style []
  {:position "absolute"
   :width "100%"
   :height "100%"
   :display "flex"
   :align-items "center"
   :justify-content "center"
   :vertical-align "middle"
   :z-index 11})
(defn floating [& children] (into [:div {:class (floating-style)}] children))

(defclass card-style []
  {:width "300px"
   :height "200px"
   :background-color "white"
   :padding-top "20px"
   :padding-bottom "20px"
   :padding-left "30px"
   :padding-right "30px"
   :border (str "1px solid" central/Constants.colors.black)
   :border-radius "5px"
   :box-shadow (str "0px 0px 1px" central/Constants.colors.lightBlack)})
(defn card [& children] (into [:div {:class (card-style)}] children))

(defclass title-style []
  {:padding-top "5px"
   :padding-bottom "25px"
   :font-size "22px"}
  (at-media {:max-width "750px"}
    {:font-size "24px"}))
(defn title [& children] (into [:div {:class (title-style)}] children))

(defclass label-style [] {:padding-bottom "3px"})
(defn label [& children] (into [:div {:class (label-style)}] children))

(defclass spacer-style [] {:height "10px"})
(defn spacer [] [:div {:class (spacer-style)}])

(defclass error-label-style []
  {:height "20px"
   :font-size "14px"}
  (at-media {:max-width "750px"}
    {:font-size "16px"}))
(defn error-label [children] (into [:div {:class (error-label-style)}] children))

(defclass textbox-style []
  {:display "block"
   :box-sizing "border-box"
   :width "100%"
   :height "35px"
   :padding-left "10px"
   :padding-right "10px"
   :border (str "1px solid" central/Constants.colors.lightBlack)
   :border-radius "3px"
   :font-size "15px"
   :font-family "'Roboto', sans-serif"
   :font-weight "100"}
  (at-media {:max-width "750px"}
    {:font-size "17px"}))
(defn textbox [attrs]
  [:input (merge-with + {:class (textbox-style) :type "text" :required true} attrs)])

(defclass submit-style []
  {:width "100%"
   :height "40px"
   :cursor "pointer"
   :border (str "1px solid" central/Constants.colors.lightBlack)
   :border-radius "5px"
   :background-color "white"
   :font-size "18px"
   :font-family "'Roboto', sans-serif"
   :font-weight "100"
   :color central/Constants.colors.black}
  [:&:hover {:background-color central/Constants.colors.whiteHover}]
  [:&:active {:background-color central/Constants.colors.whiteActive}]
  (at-media {:max-width "750px"}
    {:font-size "20px"}))
(defn submit [children] (into [:button {:class (submit-style)}] children))

(def value (r/atom ""))

(defn add-account []
  (let [error @(re-frame/subscribe [::subs/error])
        on-submit (fn [] (re-frame/dispatch [::events/add-account @value]) (re-frame/dispatch [::events/dialog-close]))]
       [card
         [title "Add Account"]
         [:form
           {:on-submit (fn [event] (.preventDefault event) (on-submit))}
           [label "Name"]
           [spacer]
           [textbox {:type "text" :value @value :on-change #(reset! value (-> % .-target .-value))}]
           [error-label error]
           [submit "Save"]
           [:input {:type "submit" :style {:display "none"}}]]]))

(defn build []
  (let [dialog @(re-frame/subscribe [::subs/dialog])]
       (cond
         (= dialog :add-account)
           [floating
             [:div
               {:on-click (fn [event] (.stopPropagation event))}
               [add-account]]]
          :else (do (reset! value "") ()))))
