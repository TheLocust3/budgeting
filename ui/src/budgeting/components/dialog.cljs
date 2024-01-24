(ns budgeting.components.dialog
  (:require
    [reagent.core :as r]
    [re-frame.core :as re-frame]
    [spade.core :refer [defclass]]
    [moment :as moment]
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
   :background-color "white"
   :padding-top "20px"
   :padding-bottom "30px"
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

(defclass header-style []
  {:padding-top "10px"
   :padding-bottom "3px"
   :font-size "14px"})
(defn header [& children] (into [:div {:class (header-style)}] children))

(defclass label-style [] {:padding-bottom "3px"})
(defn label [& children] (into [:div {:class (label-style)}] children))

(defclass spacer-style [] {:height "10px"})
(defn spacer [] [:div {:class (spacer-style)}])

(defclass error-label-style []
  {:height "20px"
   :font-size "14px"
   :color central/Constants.colors.red})
(defn error-label [& children] (into [:div {:class (error-label-style)}] children))

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
  [:input (merge-with + {:class (textbox-style) :required true} attrs)])

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
(defn submit [& children] (into [:button {:class (submit-style)}] children))

(defclass new-bucket-style []
  {:width "100%"
   :height "20px"
   :margin-top "5px"
   :margin-bottom "5px"
   :cursor "pointer"
   :border (str "1px solid" central/Constants.colors.lightBlack)
   :border-radius "5px"
   :background-color "white"
   :font-size "14px"
   :font-family "'Roboto', sans-serif"
   :font-weight "100"
   :color central/Constants.colors.black}
  [:&:hover {:background-color central/Constants.colors.whiteHover}]
  [:&:active {:background-color central/Constants.colors.whiteActive}])
(defn new-bucket [attrs & children] (into [:button (merge-with + {:class (new-bucket-style)} attrs)] children))

(defclass bucket-definition-style []
  {:display "flex"
   :margin-bottom "5px"})
(defn bucket-definition [attrs & children] (into [:div (merge-with + {:class (bucket-definition-style)} attrs)] children))

(defclass delete-style []
  {:padding-top "7px"
   :text-align "center"
   :cursor "pointer"
   :color central/Constants.colors.black}
  [:&:hover {:color central/Constants.colors.red}])
(defn delete [attrs & children] (into [:span (merge-with + {:class (delete-style)} attrs)] children))


(def value (r/atom {}))
(defn add-account []
  (let [error @(re-frame/subscribe [::subs/error])
        on-submit (fn [] (re-frame/dispatch [::events/add-account (:name @value)]) (re-frame/dispatch [::events/dialog-close]))]
       [card
         [title "Add Account"]
         [:form
           {:on-submit (fn [event] (.preventDefault event) (on-submit))}
           [label "Name"]
           [textbox {:type "text" :value (:name @value) :on-change #(reset! value (assoc @value :name (-> % .-target .-value)))}]
           [error-label error]
           [submit "Save"]
           [:input {:type "submit" :style {:display "none"}}]]]))


(defn add-bucket []
  (let [error @(re-frame/subscribe [::subs/error])
        on-submit (fn [] (re-frame/dispatch [::events/add-bucket (:name @value)]) (re-frame/dispatch [::events/dialog-close]))]
       [card
         [title "Add Bucket"]
         [:form
           {:on-submit (fn [event] (.preventDefault event) (on-submit))}
           [label "Name"]
           [textbox {:type "text" :value (:name @value) :on-change #(reset! value (assoc @value :name (-> % .-target .-value)))}]
           [error-label error]
           [submit "Save"]
           [:input {:type "submit" :style {:display "none"}}]]]))


(defn add-transaction [transaction]
  (let [error @(re-frame/subscribe [::subs/error])
        buckets @(re-frame/subscribe [::subs/buckets])
        on-submit (fn [] (re-frame/dispatch [::events/add-transaction @value]))]
       [card
         [title (if (nil? transaction) "Add Transaction" "Edit Transaction")]
         [:form
           {:on-submit (fn [event] (.preventDefault event) (on-submit))}

           [textbox
             {:type "text"
              :placeholder "Date"
              :value (:date @value)
              :on-change #(reset! value (assoc @value :date (-> % .-target .-value)))}]
           [spacer]
           
           [textbox
             {:type "text"
              :placeholder "Payee"
              :value (:payee @value)
              :on-change #(reset! value (assoc @value :payee (-> % .-target .-value)))}]
           [spacer]

           [textbox
             {:type "number"
              :step "0.01"
              :placeholder "Amount"
              :value (:amount @value)
              :on-change #(reset! value (assoc @value :amount (-> % .-target .-value)))}]
           [spacer]

           [header "Buckets:"]
           (doall (map-indexed
             (fn [idx bucket]
               (let [definition (-> @value :buckets (nth idx))
                     on-change (fn [key] (fn [e]
                                 (let [new-value (-> e .-target .-value)
                                       next (assoc definition key new-value)]
                                      (reset! value (assoc @value :buckets (assoc (:buckets @value) idx next))))))]
                    [bucket-definition
                      {:key (str (count (:bucket @value)) idx)}
                      [textbox
                        {:type "text"
                         :placeholder "Bucket"
                         :list "buckets"
                         :style {:width "68%" :margin-right "2%"}
                         :value (:bucket definition)
                         :on-change (on-change :bucket)}]
                      [textbox
                        {:type "number"
                         :step "0.01"
                         :placeholder "$"
                         :style {:width "28%" :margin-right "2%"}
                         :value (:amount definition)
                         :on-change (on-change :amount)}]
                      [delete
                        {:on-click #(reset! value (assoc @value :buckets (concat (subvec (:buckets @value) 0 idx) (subvec (:buckets @value) (+ idx 1) (count (:buckets @value))))))}
                        [:> central/Icon {:icon "delete" :size "1.2em"}]]]))
             (:buckets @value)))
           [textbox
             {:type "text"
              :placeholder "Remainder"
              :list "buckets"
              :value (:remainder @value)
              :on-change #(reset! value (assoc @value :remainder (-> % .-target .-value)))}]
           [new-bucket
             {:on-click (fn [e] (.preventDefault e) (reset! value (assoc @value :buckets (vec (conj (:buckets @value) {})))))}
             "+ Bucket"]
           [:datalist
             {:id "buckets"}
             (map (fn [bucket] [:option {:value (:name bucket) :key (:id bucket)}]) buckets)]
           
           [error-label error]
           [submit "Save"]
           [:input {:type "submit" :style {:display "none"}}]]]))


(defn build []
  (let [dialog @(re-frame/subscribe [::subs/dialog])]
       (cond
         (= (:type dialog) :add-account)
           [floating
             [:div
               {:on-click (fn [event] (.stopPropagation event))}
               [add-account]]]
         (= (:type dialog) :add-bucket)
           [floating
             [:div
               {:on-click (fn [event] (.stopPropagation event))}
               [add-bucket]]]
         (= (:type dialog) :add-transaction)
           (do
             (if (nil? @value)
               (do
                 (reset! value (assoc @value :account (:account dialog)))
                 (reset! value (assoc @value :transaction (:transaction dialog)))
                 (if (not (nil? (:transaction dialog)))
                   (let [rule @(re-frame/subscribe [::subs/rule-for (:id (:transaction dialog))])
                         remainder (:name @(re-frame/subscribe [::subs/bucket (-> rule :rule :remainder)]))
                         buckets (map
                                   (fn [split] {:bucket (:name @(re-frame/subscribe [::subs/bucket (:account split)])) :amount (:value split)})
                                   (-> rule :rule :splits))]
                        (do
                          (reset! value (assoc @value :date (-> dialog :transaction :authorizedAt moment (.format "MM/DD/YYYY"))))
                          (reset! value (assoc @value :payee (-> dialog :transaction :merchantName)))
                          (reset! value (assoc @value :amount (-> dialog :transaction :amount)))
                          (reset! value (assoc @value :buckets (vec buckets)))
                          (reset! value (assoc @value :remainder remainder)))))))
             [floating
               [:div
                 {:on-click (fn [event] (.stopPropagation event))}
                 [add-transaction (:transaction dialog)]]])
          :else (do (reset! value nil) ()))))
