(ns budgeting.components.menu
  (:require
    [re-frame.core :as re-frame]
    [spade.core :refer [defclass]]
    [central :as central]
    [budgeting.events :as events]))

(defclass outer-style []
  {:width "100%"})
(defn outer [& children] (into [:div {:class (outer-style)}] children))

(defclass pane-style []
  {:position "fixed"
   :width "82vw"
   :display "flex"
   :align-items "center"
   :background-color "white"
   :height "50px"
   :padding-left "10px"
   :padding-right "10px"
   :border-bottom (str "1px solid" central/Constants.colors.black)
   :box-shadow (str "0px 0px 1px" central/Constants.colors.lightBlack)
   :justify-content "space-between"})
(defn pane [& children]
  (into [:div {:class (pane-style)}] children))

(defclass title-style []
  {:font-size "20px"
   :color central/Constants.colors.black})
(defn title [& children] (into [:div {:class (title-style)}] children))

(defclass more-style []
  {:display "flex"
   :padding-top "5px"
   :padding-right "30px"
   :margin-left "auto"
   :margin-right "0"})
(defn more [& children] (into [:div {:class (more-style)}] children))

(defclass delete-style []
  {:cursor "pointer"
   :color central/Constants.colors.black}
  [:&:hover {:color central/Constants.colors.red}])
(defn delete [attrs & children] (into [:div (merge-with + attrs {:class (delete-style)})] children))

(defclass body-style []
  {:width "100%"
   :margin-top "50px"})
(defn body [& children] (into [:div {:class (body-style)}] children))

(defclass spacer-style [] {:width "30px" :height "100%"})
(defn spacer []
  [:div {:class (spacer-style)}])

(defclass item-style []
  {:display "block"
   :text-decoration "none"
   :font-size "15px"
   :color central/Constants.colors.black
   :cursor "pointer"}
  [:&:hover {:text-decoration "none" :color "black"}]
  [:&:visited {:text-decoration "none"}]
  [:&:active {:text-decoration "none"}])
(defn item [attrs & children]
  (into [:div (merge-with + attrs {:class (item-style)})] children))

(defn build [attrs & children]
  [outer
    [pane
      [title (:title attrs)]
      [spacer]
      (if (:on-add-transaction attrs)
        [item
          {:href "#"
           :on-click (fn [event] (do (.stopPropagation event) ((:on-add-transaction attrs))))}
          "+ Add transaction"])
      [more (if (not (nil? (:on-delete attrs)))
              [delete {:on-click (:on-delete attrs)} [:> central/Icon {:icon "delete" :size "1.25em"}]])]]
    (into [body] children)])
