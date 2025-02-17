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
    [budgeting.views.account :as account]
    [central :as central]
    [spade.core :refer [defclass defglobal]]))

(defglobal global-styles
  [:#app {:height "100%"}]
  [:#app>div {:height "100%"}])

(defclass root-style [] {:display "flex" :width "100%" :height "100%"})
(defn root [& children] (into [:div {:class (root-style)}] children))


(defn init []
  (re-frame/dispatch [::events/soft-load])
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

(defn index-root []
  [frame {:title "My Budget"}])

(defn account-root [match]
  (let [id (:id (:path (:parameters match)))
        account @(re-frame/subscribe [::subs/account id])
        on-delete (if (= (count (:transactions account)) 0) {:on-delete (fn [] (re-frame/dispatch [::events/delete-account id]))} {})
        total (if (< (:total account) 0) (str "-$" (* -1 (:total account))) (str "$" (:total account)))]
    [frame
      (merge-with
        +
        {:title (str (:name account) " (" total ")")
         :on-add-transaction (fn [] (re-frame/dispatch [::events/dialog-open {:type :add-transaction :account account}]))}
        on-delete)
      [account/build
        account
        {:on-delete-transaction (fn [id] (re-frame/dispatch [::events/delete-transaction id]))
         :on-edit-transaction (fn [transaction] (re-frame/dispatch [::events/dialog-open {:type :add-transaction :account account :transaction transaction}]))}]]))

(defn bucket-root [match]
  (let [id (:id (:path (:parameters match)))
        bucket @(re-frame/subscribe [::subs/bucket id])
        on-delete (if (= (count (:transactions bucket)) 0) {:on-delete (fn [] (re-frame/dispatch [::events/delete-bucket id]))} {})
        total (if (< (:total bucket) 0) (str "-$" (* -1 (:total bucket))) (str "$" (:total bucket)))]
    [frame
      (merge-with
        +
        {:title (str (:name bucket) " (" total ")")}
        on-delete)
      [account/build bucket]]))

(def to_login (str central/Constants.central.root "/login?redirect=" (js/encodeURIComponent central/Constants.budgeting.root)))
(defn login-root []
  [:> central/Redirect {:to to_login}])

(def routes
  [["/"
    {:name ::routes/index
     :view index-root}]

   ["/login"
    {:name ::routes/login
     :view login-root}]

   ["/account/:id"
    {:name ::routes/account
     :view account-root
     :parameters {:path {:id string?}}}]

   ["/bucket/:id"
    {:name ::routes/bucket
     :view bucket-root
     :parameters {:path {:id string?}}}]])
