(ns budgeting.api
  (:require
    [clojure.string :as string]
    [central :as central]))

(defn json [obj] (js/JSON.stringify (clj->js obj)))
(defn parse-json [json] (-> json js/JSON.parse (js->clj :keywordize-keys true)))

(defn token [] (central/Users.token))

(defn request [url options]
  (->
    (central/Api.Budgeting.request url (clj->js options))
    (.then (fn [res] (if (= (.-status res) 200) res (js/Promise.reject res))))
    (.then (fn [res] (.json res)))
    (.then #(js->clj % :keywordize-keys true))))

(defn clj->gql [obj]
  (letfn [(render-args [args]
            (str "(" (string/join ", " (map (fn [[k v]] (str (clj->gql k) ": " (clj->gql v))) args)) ")"))]

    (cond (and (map? obj) (= (:type obj) :list)) (str "[" (string/join ", " (map clj->gql (:values obj))) "]")
          (and (map? obj) (= (:type obj) :map)) (str "{" (string/join ", " (map (fn [[k v]] (str (clj->gql k) ": " (clj->gql v))) (:value obj))) "}")
          (map? obj)
            (string/join ", " (map (fn [[k v]]
                                     (cond (map? v) (str (clj->gql k) (render-args (:args v)) (clj->gql (:attrs v)))
                                           :else (str (clj->gql k) (clj->gql v)))) obj))
          (vector? obj) (str " { " (string/join ", " (map clj->gql obj)) " }")
          (keyword? obj) (name obj)
          (string? obj) (str "\"" obj "\"")
          :else (str obj))))

(defn query [obj]
  (str "{ " (clj->gql obj) " }"))

(defn mutation [obj]
  (str "mutation { " (clj->gql obj) " }"))

(defn load-all []
  (let [body {:user [:id :email]
              :total nil
              :accounts [:id :name :total {:transactions [:id :authorizedAt :amount :merchantName] :metadata nil}]
              :buckets [:id :name :total {:transactions [:id :authorizedAt :amount :merchantName]}]
              :rules [:id :rule]}]
    (->
      (request "/graphql?" {:method "POST" :body (json {:query (query body)})})
      (.then #(:data %)))))

(defn add-account [name]
  (let [body {:createManualAccount {:args {:name name} :attrs [:id]}}]
    (->
      (request "/graphql?" {:method "POST" :body (json {:query (mutation body)})})
      (.then #(:data %)))))

(defn delete-account [id]
  (let [body {:deleteAccount {:args {:id id}}}]
    (->
      (request "/graphql?" {:method "POST" :body (json {:query (mutation body)})})
      (.then #(:data %)))))

(defn add-bucket [name]
  (let [body {:createBucket {:args {:name name} :attrs [:id]}}]
    (->
      (request "/graphql?" {:method "POST" :body (json {:query (mutation body)})})
      (.then #(:data %)))))

(defn delete-bucket [id]
  (let [body {:deleteBucket {:args {:id id}}}]
    (->
      (request "/graphql?" {:method "POST" :body (json {:query (mutation body)})})
      (.then #(:data %)))))

(defn add-transaction [transaction]
  (let [body {:createTransaction {:args transaction :attrs [:id]}}]
    (->
      (request "/graphql?" {:method "POST" :body (json {:query (mutation body)})})
      (.then #(-> % :data :createTransaction)))))

(defn delete-transaction [id]
  (let [body {:deleteTransaction {:args {:id id}}}]
    (->
      (request "/graphql?" {:method "POST" :body (json {:query (mutation body)})})
      (.then #(:data %)))))

(defn split-by-value [rule]
  (let [body {:createSplitByValue {:args rule :attrs [:id]}}]
    (->
      (request "/graphql?" {:method "POST" :body (json {:query (mutation body)})})
      (.then #(-> % :data :createSplitByValue)))))

(defn delete-rule [id]
  (let [body {:deleteRule {:args {:id id}}}]
    (->
      (request "/graphql?" {:method "POST" :body (json {:query (mutation body)})})
      (.then #(:data %)))))
