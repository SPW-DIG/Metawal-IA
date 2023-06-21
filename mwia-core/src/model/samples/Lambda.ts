import { PersonalProfile } from "../PersonalProfile";

export const LambdaUser1: PersonalProfile = {
  uri: "https://geoportail.wallonie.be/users/user001",

  "contactInfo": {
    name: "Lambda User 1"
  },

  // "ULIS": "***",

  userCategories: [],

  tagsOfInterest: [],

  lastVisit: "2023-03-21T10:00:00Z",

  searchHistory: [
    {searchstring: "Orthophotos", timestamp: "2023-03-21T10:15:00Z"}
  ],

  browseHistory: [
  ],

  downloadHistory: [],

  savedMaps: []
};

export const LambdaUser2: PersonalProfile = {
  uri: "https://geoportail.wallonie.be/users/user002",

  "contactInfo": {
    name: "Lambda User 2"
  },

  // "ULIS": "***",

  userCategories: [],

  tagsOfInterest: ["http://geonetwork-opensource.org/gemet/concepts/risque%20naturel"],

  lastVisit: "2023-03-21T10:00:00Z",

  searchHistory: [
    {searchstring: "Orthophotos", timestamp: "2023-03-21T10:15:00Z"}
  ],

  browseHistory: [
    {
      timestamp: "2023-04-20T10:15:00Z",
      datasetUri: "http://localhost:8080/geonetwork/srv/resources/e8463e37-da70-41f0-8157-fcb7d186e394"
    }
  ],

  downloadHistory: [],

  savedMaps: []
};