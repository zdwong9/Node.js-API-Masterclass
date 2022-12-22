const advancedResults = (model, populate) => async (req, res, next) => {
  const reqQuery = { ...req.query };

  //remove fields
  let queryString = removeSelectAndSortField(reqQuery);

  // query db
  let query = model.find(JSON.parse(queryString));

  // Select fields
  query = selectAndSort(req, query);

  const quantityPerPage = 100;
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || quantityPerPage;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const total = await model.countDocuments();

  query = query.skip(startIndex).limit(limit);

  if (populate) {
    query = query.populate(populate);
  }

  const results = await query;

  // Pagination result
  const pagination = {};

  if (endIndex < total) {
    pagination.next = {
      page: page + 1,
      limit,
    };
  }

  if (startIndex > 0) {
    pagination.prev = {
      page: page - 1,
      limit,
    };
  }

  res.advancedResults = {
    success: true,
    count: results.length,
    data: results,
    pagination,
  };

  next();
};

function selectAndSort(req, query) {
  if (req.query.select) {
    const fields = req.query.select.split(",").join(" ");
    query = query.select(fields);
  }

  //Sort fields
  if (req.query.sort) {
    const sortBy = req.query.sort.split(",").join(" ");
    query = query.sort(sortBy);
  } else {
    query = query.sort("-created_at");
  }
  return query;
}

function removeSelectAndSortField(reqQuery) {
  const removeFields = ["select", "sort", "page", "limit"];

  removeFields.forEach(param => delete reqQuery[param]);

  let queryString = JSON.stringify(reqQuery);

  queryString = queryString.replace(
    /\b(gt|gte|lt|lte|in)\b/g,
    match => `$${match}`
  );
  return queryString;
}

module.exports = { advancedResults };
