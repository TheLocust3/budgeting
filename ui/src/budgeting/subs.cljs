(ns budgeting.subs
  (:require
    [re-frame.core :as re-frame]))

(re-frame/reg-sub
 ::user
 (fn [db]
   (:user db)))

(re-frame/reg-sub
 ::accounts
 (fn [db]
   (:accounts db)))

(re-frame/reg-sub
 ::account
 (fn [db [_ id]]
   (->>
     (:accounts db)
     (filter (fn [account] (= (:id account) id)))
     first)))

(re-frame/reg-sub
 ::dialog
 (fn [db]
   (:dialog db)))

(re-frame/reg-sub
 ::error
 (fn [db]
   (:error db)))

