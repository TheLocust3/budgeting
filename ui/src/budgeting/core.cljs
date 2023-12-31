(ns budgeting.core
  (:require
    [reagent.core :as r]
    [reagent.dom :as rdom]
    [re-frame.core :as re-frame]
    [reitit.frontend :as rf]
    [reitit.frontend.easy :as rfe]
    [reitit.coercion.spec :as rss]
    [budgeting.events :as events]
    [budgeting.views :as views]
    [budgeting.config :as config]))


(defn dev-setup []
  (when config/debug?
    (println "dev mode")))

(defonce match (r/atom nil))

(defn root []
  [:div
    (if @match
     (let [view (:view (:data @match))]
       [view @match]))])

(defn ^:dev/after-load mount-root []
  (re-frame/clear-subscription-cache!)
  (let [root-el (.getElementById js/document "app")]
    (rdom/unmount-component-at-node root-el)
    (rdom/render [root] root-el)))

(defn init []
  (re-frame/dispatch-sync [::events/initialize-db])
  (dev-setup)
  (rfe/start!
    (rf/router views/routes {:data {:coercion rss/coercion}})
    (fn [m] (reset! match m))
    {:use-fragment false})
  (mount-root))
