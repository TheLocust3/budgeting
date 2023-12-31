(ns budgeting.api
  (:require
    [clojure.string :as string]
    [central :as central]))

(defn json [obj] (js/JSON.stringify (clj->js obj)))
(defn parse-json [json] (-> json js/JSON.parse (js->clj :keywordize-keys true)))

(defn token [] (central/Users.token))

(defn central-request [url options]
  (->
    (central/Api.Central.request url (clj->js options))
    (.then (fn [res] (.json res)))
    (.then #(js->clj % :keywordize-keys true))))

(defn get-user []
  (->
    (central-request "/users/validate" {:method "POST" :body (json {:token (token)})})
    (.then #(:user %))))
