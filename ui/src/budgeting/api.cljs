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
    (.then (fn [res] (if (= (.-status res) 200) res (js/reject res))))
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


(defn load-all []
  (->
    (request "/graphql?" {:method "POST" :body (json {:query "{\n  user {\n    id,\n    email\n  },\n  total,\n  accounts {\n    id,\n    name,\n    total,\n    transactions {\n      id,\n      amount,\n      merchantName,\n      description\n    }\n  },\n  buckets {\n    id,\n    name,\n    total,\n    transactions {\n      id\n    }\n  }\n}"})})
    (.then #(:data %))))
