(ns budgeting.components.sidebar
  (:require
    [clojure.core.reducers :as reducers]
    [reagent.core :as r]
    [re-frame.core :as re-frame]
    [spade.core :refer [defclass]]
    [central :as central]
    [budgeting.events :as events]
    [budgeting.subs :as subs]))

(defclass outer-style [] {:width "100%" :display "flex"})
(defn outer [& children] (into [:div {:class (outer-style)}] children))

(defclass pane-style [] {:min-width "23vw" :z-index 10})
(defn pane [& children] (into [:div {:class (pane-style)}] children))

(defclass pane-inner-style []
  {:min-width "23vw"
   :max-width "23vw"
   :min-height "100%"
   :max-height "100%"
   :position "fixed"
   :overflow-x "hidden"
   :overflow-y "scroll"
   :border-right (str "1px solid" central/Constants.colors.black)
   :background-color "white"
   :box-shadow (str "0px 0px 1px" central/Constants.colors.black)})
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
  [:&:active {:text-decoration "none"}])
(defn header [attrs & children]
  (into [:a (merge-with + attrs {:class (header-style)})] children))

(defclass header-no-link-style []
  {:padding-left "20px"
   :padding-top "5px"
   :padding-bottom "5px"
   :text-decoration "none"
   :font-size "18px"
   :color central/Constants.colors.black}
  [:&:hover {:color "black"}])
(defn header-no-link [children]
  (into [:div {:class (header-style)}] children))

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
   :padding-bottom "2px"
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

(defclass folder-title-style []
  {:margin-left "20px"
   :margin-bottom "7px"
   :font-size "16px"
   :user-select "none"
   :cursor "pointer"}
  [:&:hover {:color "black"}]
  [:&:active {:color "black"}])
(defn folder-title [attrs & children]
  (into [:div (merge-with + attrs {:class (folder-title-style)})]
    children))

(defonce collapsed (r/atom (set ["Hidden Categories"])))

(defn build [& children]
  (letfn [(render-total [total]
            (if (< total 0) (str "-$" (* -1 total)) (str "$" total)))
          (build-accounts []
            (let [accounts @(re-frame/subscribe [::subs/accounts])]
              (map (fn [account]
                     [item
                       {:key (:id account) :href (str "/account/" (:id account))}
                       (:name account) " (" (render-total (:total account)) ")"])
                   accounts)))
          (build-buckets []
            (let [buckets @(re-frame/subscribe [::subs/buckets])
                  by-folder (reducers/reduce
                              (fn [acc bucket]
                                  (let [folder (:folder bucket)]
                                  (assoc acc (:folder bucket) (concat (get acc folder) [bucket]))))
                                {} buckets)]
              (doall
                (map (fn [[folder buckets]]
                       (if (contains? @collapsed folder)
                         [:div {:key folder}
                             (folder-title {:on-click (fn [] (reset! collapsed (disj @collapsed folder)))} folder)]
                         [:div {:key folder}
                             (folder-title {:on-click (fn [] (reset! collapsed (conj @collapsed folder)))} folder)
                             (map (fn [bucket]
                                    [item
                                      {:key (:id bucket) :href (str "/bucket/" (:id bucket))}
                                      (:short-name bucket) " (" (render-total (:total bucket)) ")"])
                                  buckets)
                             [spacer2]]))
                     by-folder))))]

    (into [outer
            [pane
              [pane-inner
                [container
                  [header-no-link "My Budget"]
                  [big-spacer]
                  [divider]
                  [big-spacer]

                  [header-no-link "Buckets"]
                  [spacer]
                  [item
                    {:href "#"
                     :on-click
                       (fn [event] 
                         (do (.stopPropagation event) (re-frame/dispatch [::events/dialog-open {:type :add-bucket}])))}
                    "+ Add bucket"]
                  [spacer]
                  (build-buckets)
                  [big-spacer]
                  [divider]
                  [big-spacer]

                  [header-no-link "Accounts"]
                  [spacer]
                  [item
                    {:href "#"
                     :on-click
                       (fn [event] 
                         (do (.stopPropagation event) (re-frame/dispatch [::events/dialog-open {:type :add-account}])))}
                    "+ Add account"]
                  [spacer]
                  (build-accounts)]]]]
      children)))
