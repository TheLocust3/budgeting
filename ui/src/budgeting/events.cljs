(ns budgeting.events
  (:require
    [clojure.string :as string]
    [re-frame.core :as re-frame]
    [reitit.frontend.easy :as rfe]
    [moment :as moment]
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
 ::set-error
 (fn [db [_ error]]
   (assoc db :error error)))


(re-frame/reg-event-db
 ::dialog-open
 (fn [db [_ dialog]]
   (assoc db :dialog dialog)))

(re-frame/reg-event-db
 ::dialog-close
 (fn [db _]
   (assoc db :dialog {} :error nil)))


(re-frame/reg-event-db
 ::load-complete
 (fn [db [_ state]]
   (letfn [(with-folder [bucket]
             (let [name (:name bucket)
                   folder (string/split name #": " 2)]
                   (assoc (assoc bucket
                                 :short-name
                                 (if (= (count folder) 2) (second folder) name))
                          :folder
                          (if (= (count folder) 2) (first folder) "default"))))]
     (->
       db
       (assoc :loaded? true)
       (assoc :user (:user state))
       (assoc :accounts (map with-folder (:accounts state)))
       (assoc :buckets (map with-folder (:buckets state)))
       (assoc :rules (:rules state))))))

(re-frame/reg-event-db
 ::load
 (fn [db _]
   (do
     (.then (api/load-all)
       #(re-frame/dispatch [::load-complete %]))
     db)))

(re-frame/reg-event-db
 ::soft-load
 (fn [db _]
   (if (not (:loaded? db)) (re-frame/dispatch [::load]))
   db))

(re-frame/reg-event-db
 ::add-account
 (fn [db [_ name]]
   (do
     (.then (api/add-account name)
       #(re-frame/dispatch [::load]))
     db)))


(re-frame/reg-event-db
 ::delete-account
 (fn [db [_ id]]
   (do
     (.then (api/delete-account id)
       #(re-frame/dispatch [::load]))
     db)))


(re-frame/reg-event-db
 ::add-bucket
 (fn [db [_ name]]
   (do
     (.then (api/add-bucket name)
       #(re-frame/dispatch [::load]))
     db)))


(re-frame/reg-event-db
 ::delete-bucket
 (fn [db [_ id]]
   (do
     (.then (api/delete-bucket id)
       #(re-frame/dispatch [::load]))
     db)))


(re-frame/reg-event-db
 ::add-transaction
 (fn [db [_ transaction]]
   (if (not (nil? (:transaction transaction))) (re-frame/dispatch [::delete-transaction (:id (:transaction transaction))]))
   (letfn [(get-bucket [name]
            (->>
              (:buckets db)
              (filter (fn [bucket] (= (:name bucket) name)))
              first
              :id))]
     (let [buckets (map (fn [rule] {:type :map :value {:bucket (get-bucket (:bucket rule)) :value (js/Number (:amount rule))}}) (:buckets transaction))
           remainder (get-bucket (:remainder transaction))
           args
            {:sourceId (-> transaction :account :metadata :sourceId :value)
             :amount (js/Number (:amount transaction))
             :merchantName (:payee transaction)
             :description ""
             :authorizedAt (-> (:date transaction) moment .valueOf)}
           build-rule (fn [id] {:transactionId id
                                :splits {:type :list :values buckets}
                                :remainder remainder})]
       (cond
         (js/isNaN (:authorizedAt args)) (re-frame/dispatch [::set-error "Invalid date"])
         (> (count (filter #(= (:bucket (:value %)) nil) buckets)) 0) (re-frame/dispatch [::set-error "Invalid bucket"])
         (nil? remainder) (re-frame/dispatch [::set-error "Invalid remainder bucket"])
         :else (do
                 (->
                   (api/add-transaction args)
                   (.then #(api/split-by-value (build-rule (:id %))))
                   (.then #(re-frame/dispatch [::load]))
                   (.then #(re-frame/dispatch [::dialog-close]))
                 db)))))))


(re-frame/reg-event-db
 ::delete-transaction
 (fn [db [_ id]]
   (do
     (let [rule (->> (:rules db) (filter (fn [rule] (= (-> rule :rule :where :value) id))) first)]
       (->
         (api/delete-rule (:id rule))
         (.then (api/delete-transaction id))
         (.then #(re-frame/dispatch [::load])))
     db))))
