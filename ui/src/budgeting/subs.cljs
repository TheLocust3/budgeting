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
