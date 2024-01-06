(ns budgeting.components.sidebar
  (:require
    [reagent.core :as r]
    [re-frame.core :as re-frame]
    [spade.core :refer [defclass]]
    [central :as central]
    [budgeting.subs :as subs]))

(defclass outer-style [] {:width "100%" :display "flex"})
(defn outer [& children] (into [:div {:class (outer-style)}] children))

(defclass pane-style [] {:min-width "18vw" :z-index 10})
(defn pane [& children] (into [:div {:class (pane-style)}] children))

(defclass pane-inner-style []
  {:min-width "18vw"
   :max-width "18vw"
   :min-height "100%"
   :max-height "100%"
   :position "fixed"
   :overflow-x "hidden"
   :overflow-y "scroll"
   :border-right (str "1px solid" central/Constants.colors.black)
   :background-color "white"
   :box-shadow (str "0px 0px 1px" central/Constants.colors.black)}
  (at-media {:max-width "750px"}
    {:min-width "100%"}))
(defn pane-inner [& children] (into [:div {:class (pane-inner-style)}] children))

(defclass container-style [] {:padding-top "14px" :padding-bottom "50px"})
(defn container [& children]
  (into [:div {:class (container-style)}] children))

(defclass header-style []
  {:padding-left "20px"
   :padding-top "5px"
   :padding-bottom "5px"
   :text-decoration "none"
   :font-size "18px"
   :color central/Constants.colors.black}
  [:&:hover {:text-decoration "none" :color "black"}]
  [:&:visited {:text-decoration "none"}]
  [:&:active {:text-decoration "none"}]
  (at-media {:max-width "750px"}
    {:font-size "22px"}))
(defn header [attrs & children]
  (into [:a (merge-with + attrs {:class (header-style)})] children))

(defclass spacer-style [] {:width "100%" :height "8px"})
(defn spacer []
  [:div {:class (spacer-style)}])

(defclass big-spacer-style [] {:width "100%" :height "16px"})
(defn big-spacer []
  [:div {:class (big-spacer-style)}])

(defclass divider-style [] {
  :margin-left "5px"
  :margin-right "5px"
  :border "0"
  :border-top (str "1px solid " central/Constants.colors.black)})
(defn divider []
  [:div {:class (divider-style)}])

(defclass item-style []
  {:display "block"
   :padding-left "30px"
   :text-decoration "none"
   :font-size "15px"
   :color central/Constants.colors.black
   :cursor "pointer"}
  [:&:hover {:text-decoration "none" :color "black"}]
  [:&:visited {:text-decoration "none"}]
  [:&:active {:text-decoration "none"}]
  (at-media {:max-width "750px"}
    {:font-size "18px" :padding-top "7px"}))
(defn item [attrs & children]
  (into [:a (merge-with + attrs {:class (item-style)})] children))

(defclass spacer2-style [] {:height "10px"})
(defn spacer2 [] [:div {:class (spacer2-style)}])

(defn build [& children]
  (letfn [(build-accounts []
            (let [accounts @(re-frame/subscribe [::subs/accounts])]
              (map (fn [account] [item {:key (:id account) :href (str "/account/" (:id account))} (:name account)]) accounts)))]

    (into [outer
            [pane
              [pane-inner
                [container
                  [header {:href "/budget"} "My Budget"]
                  [spacer]
                  [item {:href "#"} "+ Add transaction"]
                  [big-spacer]
                  [divider]
                  [big-spacer]
                  [header {:href "#"} "Accounts"]
                  [spacer]
                  [item {:href "#"} "+ Add account"]
                  (build-accounts)]]]]
      children)))
