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

(defn central-request [url options]
  (->
    (central/Api.Central.request url (clj->js options))
    (.then (fn [res] (.json res)))
    (.then #(js->clj % :keywordize-keys true))))

(defn get-user []
  (->
    (central-request "/users/validate" {:method "POST" :body (json {:token (token)})})
    (.then #(:user %))))


(defn clj->gql [obj mutation?]
  (defn inner [obj]
    (cond (map? obj) (string/join ", " (map (fn [[k v]] (str (inner k) (inner v))) obj))
          (vector? obj) (str " { " (string/join ", " (map inner obj)) " }")
          (keyword? obj) (name obj)
          :else (str obj)))

    (if mutation?
      (str "mutation { " (inner obj) " }")
      (str "{ " (inner obj) " }")))

(defn load-all []
  (let [query {:user [:id :email]
               :total nil
               :accounts [:id :name :total {:transactions [:id :amount :merchantName :description]}]
               :buckets [:id :name :total {:transactions [:id]}]}]
    (->
      (request "/graphql?" {:method "POST" :body (json {:query (clj->gql query false)})})
      (.then #(:data %)))))
