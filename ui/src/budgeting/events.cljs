(ns budgeting.events
  (:require
    [re-frame.core :as re-frame]
    [reitit.frontend.easy :as rfe]
    [budgeting.db :as db]
    [budgeting.api :as api]
    [central :as central]))

(defn reg-event-with-user [event fun]
  (re-frame/reg-event-db
    event
    (fn [db x]
      (if (nil? (:user db))
        (do (re-frame/dispatch [::get-user x]) db)
        (fun db x)))))


(re-frame/reg-event-db
 ::initialize-db
 (fn [_ _]
   db/default-db))


(re-frame/reg-event-db
 ::get-user-complete
 (fn [db [_ user after]]
   (do
     (if (not (nil? user)) (re-frame/dispatch after))
     (assoc db :user user))))

(re-frame/reg-event-db
 ::get-user
 (fn [db [_ after]]
   (do
     (.then (api/get-user)
       #(re-frame/dispatch [::get-user-complete % after]))
     db)))
