(ns budgeting.views
  (:require
    [re-frame.core :as re-frame]
    [react :as react]
    [budgeting.routes :as routes]
    [budgeting.styles :as styles]
    [budgeting.subs :as subs]
    [budgeting.events :as events]
    [budgeting.components.sidebar :as sidebar]
    [central :as central]
    [spade.core :refer [defclass defglobal]]))

(defglobal global-styles
  [:#app {:height "100%"}]
  [:#app>div {:height "100%"}])

(defclass root-style [] {:display "flex" :width "100%" :height "100%"})
(defn root [& children] (into [:div {:class (root-style)}] children))

(defn frame [& children]
  (do (re-frame/dispatch [::events/load])
    [root (into [sidebar/build] children)]))

(defn index []
  [frame "hello world"])

(defn account [match]
  (let [id (:id (:path (:parameters match)))
        account @(re-frame/subscribe [::subs/account id])]
    [frame (:name account)]))

(def to_login (str central/Constants.central.root "/login?redirect=" (js/encodeURIComponent central/Constants.budgeting.root)))
(defn login []
  [:> central/Redirect {:to to_login}])

(def routes
  [["/"
    {:name ::routes/index
     :view index}]

   ["/login"
    {:name ::routes/login
     :view login}]

   ["/account/:id"
    {:name ::routes/account
     :view account
     :parameters {:path {:id string?}}}]])
