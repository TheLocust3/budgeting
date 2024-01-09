(ns budgeting.views
  (:require
    [re-frame.core :as re-frame]
    [react :as react]
    [budgeting.routes :as routes]
    [budgeting.styles :as styles]
    [budgeting.subs :as subs]
    [budgeting.events :as events]
    [budgeting.components.sidebar :as sidebar]
    [budgeting.components.menu :as menu]
    [budgeting.components.dialog :as dialog]
    [central :as central]
    [spade.core :refer [defclass defglobal]]))

(defglobal global-styles
  [:#app {:height "100%"}]
  [:#app>div {:height "100%"}])

(defclass root-style [] {:display "flex" :width "100%" :height "100%"})
(defn root [& children] (into [:div {:class (root-style)}] children))


(defn init []
  (re-frame/dispatch [::events/load])
  (react/useEffect (fn []
                      (let [listener (fn [event] (if (= (.-key event) "Escape") (re-frame/dispatch [::events/dialog-close])))]
                        (do (js/document.addEventListener "keydown" listener)
                            (fn [] (js/document.removeEventListener "keydown" listener))))))
 (react/useEffect (fn []
                      (let [listener (fn [] (re-frame/dispatch [::events/dialog-close]))]
                        (do (js/document.addEventListener "click" listener)
                            (fn [] (js/document.removeEventListener "click" listener)))))))

(defn frame [attrs & children]
  [:f> (fn []
         (do (init)
             [root [sidebar/build (into [menu/build attrs] children)]
                   [dialog/build]]))])

(defn index []
  [frame {:title "My Budget"} "hello world"])

(defn account [match]
  (let [id (:id (:path (:parameters match)))
        account @(re-frame/subscribe [::subs/account id])]
    [frame {:title (:name account) :on-delete (fn [] (re-frame/dispatch [::events/delete-account id]))} [:div (:id account)]]))

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
