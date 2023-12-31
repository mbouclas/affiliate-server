export function getElasticSearchMappings(indexName: string) {

  return {
    "settings": {
      "analysis": {
        "filter": {
          "autocomplete_filter": {
            "type": "edge_ngram",
            "min_gram": 1,
            "max_gram": 20
          },
          "greek_stop": {
            "type": "stop",
            "stopwords": "_greek_"
          },
          "greek_lowercase": {
            "type": "lowercase",
            "language": "greek"
          },
          "greek_stemmer": {
            "type": "stemmer",
            "language": "greek"
          }
        },
        "analyzer": {
          "autocomplete": {
            "type": "custom",
            "tokenizer": "standard",
            "filter": [
              "lowercase",
              "autocomplete_filter"
            ]
          },
          "rebuilt_greek": {
            "tokenizer": "standard",
            "filter": [
              "greek_lowercase",
              "greek_stop",
              "greek_stemmer"
            ]
          }
        }
      }
    },
    "mappings": {
      "properties" : {
        "id": {
          "type": "text",
          "analyzer": "autocomplete",
          "search_analyzer": "standard"
        },
        "title": {
          "type": "text",
          "analyzer": "autocomplete",
          "search_analyzer": "standard",
          "fields": {
            "keyword": {
              "type": "keyword",
              "ignore_above": 256
            }
          }
        },
        "sku": {
          "type": "text",
          "analyzer": "autocomplete",
          "search_analyzer": "standard",
          "fields": {
            "keyword": {
              "type": "keyword",
              "ignore_above": 256
            }
          }
        },
        "description": {
          "type": "text",
          "analyzer": "autocomplete",
          "search_analyzer": "standard"
        },
        "categories": {
          "type": "nested",
          "properties": {
            "uuid": {
              "type": "keyword"
            },
            "slug": {
              "type": "keyword"
            },
            "title": {
              "type": "text",
              "analyzer": "autocomplete",
              "search_analyzer": "standard",
              "fields": {
                "keyword": {
                  "type": "keyword"
                }
              }
            }
          }
        },
        "properties": {
          "type": "nested",
          "properties": {
            "uuid": {
              "type": "keyword"
            },
            "slug": {
              "type": "keyword"
            },
            "image": {
              "type": "text"
            },
            "title": {
              "type": "text",
              "analyzer": "autocomplete",
              "search_analyzer": "standard",
              "fields": {
                "keyword": {
                  "type": "keyword"
                }
              }
            }
          }
        },
        "tags": {
          "type": "nested",
          "properties": {
            "uuid": {
              "type": "keyword"
            },
            "slug": {
              "type": "keyword"
            },
            "title": {
              "type": "text",
              "analyzer": "autocomplete",
              "search_analyzer": "standard",
              "fields": {
                "keyword": {
                  "type": "keyword"
                }
              }
            }
          }
        },
        "manufacturer": {
          "type": "nested",
          "properties": {
            "uuid": {
              "type": "keyword"
            },
            "slug": {
              "type": "keyword"
            },
            "title": {
              "type": "text",
              "analyzer": "autocomplete",
              "search_analyzer": "standard",
              "fields": {
                "keyword": {
                  "type": "keyword"
                }
              }
            }
          }
        },
        "variants": {
          "type": "nested",
          "properties": {
            "uuid": {
              "type": "keyword"
            },
            "slug": {
              "type": "keyword"
            },
            "title": {
              "type": "text",
              "analyzer": "autocomplete",
              "search_analyzer": "standard",
              "fields": {
                "keyword": {
                  "type": "keyword"
                }
              }
            },
            "price": {
              "type": "integer"
            },
            "variantId": {
              "type": "text",
              "analyzer": "autocomplete",
              "search_analyzer": "standard",
              "fields": {
                "keyword": {
                  "type": "keyword"
                }
              }
            },
            "color": {
              "type": "text"
            },
            "sku": {
              "type": "text"
            }
          }
        },
        "price": {
          "type": "integer"
        },
        "slug": {
          "type": "text"
        }
      }
    }
  }
}
