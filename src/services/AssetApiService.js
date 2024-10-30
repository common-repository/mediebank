import BaseApiService from "./BaseApiService";

export default class AssetApiService extends BaseApiService {
  searchProperties = {
    searchQuery: "",
    offset: 0,
    limit: 50,
    createdBy: "everyone",
    order: "uploadedDesc",
  };

  query(searchQuery) {
    this.searchProperties.searchQuery = searchQuery;

    if (searchQuery.length >= 1) {
      this.searchProperties.order = "relevance";
    } else {
      this.searchProperties.order = "uploadedDesc";
    }

    return this;
  }

  offset(offset) {
    this.searchProperties.offset = offset;
    return this;
  }

  async fetch() {
    const searchParams = new URLSearchParams({
      query: this.searchProperties.searchQuery,
      offset: this.searchProperties.offset,
      limit: this.searchProperties.limit,
      createdBy: this.searchProperties.createdBy,
      order: this.searchProperties.order,
    });

    return super.get(`/assets?${searchParams.toString()}`);
  }

  async addToWordPress(id, resolveCb, rejectCb, finallyCb) {
    return new Promise((resolve, reject) => {
      super
        .post(`/assets/${id}`)
        .then((response) => resolve(resolveCb(id, response)))
        .catch(() => reject(rejectCb(id)))
        .finally(() => finallyCb(id));
    });
  }
}
