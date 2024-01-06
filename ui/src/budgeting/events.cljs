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
 ::load-complete
 (fn [db [_ state]]
   (->
     db
     (assoc :user (:user state))
     (assoc :accounts (:accounts state)))))

(re-frame/reg-event-db
 ::load
 (fn [db _]
   (do
     (.then (api/load-all)
       #(re-frame/dispatch [::load-complete %]))
     db)))
