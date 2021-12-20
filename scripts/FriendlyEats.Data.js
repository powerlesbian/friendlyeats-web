/**
 * Copyright 2017 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';

FriendlyEats.prototype.addRestaurant = function(data) {
  var collection = firebase.firestore().collection('restaurants');
  return collection.add(data);
};

FriendlyEats.prototype.getAllRestaurants = function(renderer) {
  var query = firebase.firestore()
      .collection('restaurants')
      .orderBy('avgRating', 'desc')
      .limit(50);

  this.getDocumentsInQuery(query, renderer);
};

//In the code above, we construct a query which will retrieve up to 50 restaurants 
//from the top-level collection named restaurants, which are ordered by the average 
//rating (currently all zero). After we declared this query, we pass it to the 
//getDocumentsInQuery() method which is responsible for loading and rendering the data.

//A listener will be notified of all existing data that matches the query and will 
//receive updates in real time.

FriendlyEats.prototype.getDocumentsInQuery = function(query, renderer) {
  query.onSnapshot(function(snapshot) {
    if (!snapshot.size) return renderer.empty(); // Display "There are no restaurants".

    snapshot.docChanges().forEach(function(change) {
      if (change.type === 'removed') {
        renderer.remove(change.doc);
      } else {
        renderer.display(change.doc);
      }
    });
  });
};
// In the code above, query.onSnapshot will trigger its callback every time there's a change to the result of the query.
// The first time, the callback is triggered with the entire result set of the query – 
// meaning the whole restaurants collection from Cloud Firestore. It then passes all the individual documents to the renderer.display function.
// When a document is deleted, change.type equals to removed. So in this case, we'll call a function that removes the restaurant from the UI.


//note It's also possible to fetch documents from Cloud Firestore once, rather than listening for real time updates using the Query.get() method.

FriendlyEats.prototype.getRestaurant = function(id) {
  return firebase.firestore().collection('restaurants').doc(id).get();
};

FriendlyEats.prototype.getFilteredRestaurants = function(filters, renderer) {
  var query = firebase.firestore().collection('restaurants');

  if (filters.category !== 'Any') {
    query = query.where('category', '==', filters.category);
  }

  if (filters.city !== 'Any') {
    query = query.where('city', '==', filters.city);
  }

  if (filters.price !== 'Any') {
    query = query.where('price', '==', filters.price.length);
  }

  if (filters.sort === 'Rating') {
    query = query.orderBy('avgRating', 'desc');
  } else if (filters.sort === 'Reviews') {
    query = query.orderBy('numRatings', 'desc');
  }

  this.getDocumentsInQuery(query, renderer);
};

// The code above adds multiple where filters and a single orderBy clause to build a compound query based on user input. 
//Our query will now only return restaurants that match the user's requirements.

FriendlyEats.prototype.addRating = function(restaurantID, rating) {
  var collection = firebase.firestore().collection('restaurants');
  var document = collection.doc(restaurantID);
  var newRatingDocument = document.collection('ratings').doc();

  return firebase.firestore().runTransaction(function(transaction) {
    return transaction.get(document).then(function(doc) {
      var data = doc.data();

      var newAverage =
          (data.numRatings * data.avgRating + rating.rating) /
          (data.numRatings + 1);

      transaction.update(document, {
        numRatings: data.numRatings + 1,
        avgRating: newAverage
      });
      return transaction.set(newRatingDocument, rating);
    });
  });
};

