(ns budgeting.views
  (:require
    [re-frame.core :as re-frame]
    [react :as react]
    [budgeting.routes :as routes]
    [budgeting.styles :as styles]
    [budgeting.subs :as subs]
    [budgeting.events :as events]
    [central :as central]
    [spade.core :refer [defclass defglobal]]))

(defglobal global-styles
  [:#app {:height "100%"}]
  [:#app>div {:height "100%"}])

(defclass root-style [] {:display "flex" :width "100%" :height "100%"})
(defn root [children] (into [:div {:class (root-style)}] children))

(defn index [match]
  [root "hello world"])

(def to_login (str central/Constants.central.root "/login?redirect=" (js/encodeURIComponent central/Constants.budgeting.root)))
(defn login []
  [:> central/Redirect {:to to_login}])

(def routes
  [["/"
    {:name ::routes/index
     :view index}]

   ["/login"
    {:name ::routes/login
     :view login}]])
