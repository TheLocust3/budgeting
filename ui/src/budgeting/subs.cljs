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
 ::bucket
 (fn [db [_ id]]
   (->>
     (:buckets db)
     (filter (fn [bucket] (= (:id bucket) id)))
     first)))

(re-frame/reg-sub
 ::buckets
 (fn [db]
   (:buckets db)))

(re-frame/reg-sub
 ::rule-for
 (fn [db [_ transaction-id]]
   (->>
     (:rules db)
     (filter (fn [rule] (= (-> rule :rule :where :value) transaction-id)))
     first)))

(re-frame/reg-sub
 ::dialog
 (fn [db]
   (:dialog db)))

(re-frame/reg-sub
 ::error
 (fn [db]
   (:error db)))

