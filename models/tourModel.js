const mongoose = require('mongoose');
const slugify = require('slugify');
//const User = require('./userModel');
//const validator = require('validator');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      trim: true,
      maxlength: [40, 'A tour name must have less than or equal 40 characters'],
      minlength: [10, 'A tour name must have more than or equal 10 characters'],
      //validate: [
      //  validator.isAlpha,
      //  'A tour name must only contain alpha characters',
      //],
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either easy, medium or difficult',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
      set: (val) => Math.round(val * 10) / 10,
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          // this keyword points to the current document when we are creating a new document. This function won't work for update
          return val < this.price;
        },
        message:
          'Discount Price ({VALUE}) cannot be greater than Regular Price',
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a description'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image'],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },
    startLocation: {
      //GeoJSON
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    guides: [{ type: mongoose.Schema.ObjectId, ref: 'User' }],
  },
  {
    toJSON: { virtuals: true }, // this is to add the virtual fields to the response
    toObject: { virtuals: true },
  }
);

// This middleware is to make the tours be sorted automatically from smallest price to largest price
// tourSchema.index({ price: 1 });

// This middleware is to make the tours be sorted automatically from smallest price to largest price and from highest rating average to lowest rating average
tourSchema.index({ price: 1, ratingsAverage: -1 });

// This middleware is to make the tours be sorted automatically based on the slug value.
tourSchema.index({ slug: 1 });

tourSchema.index({ startLocation: '2dsphere' });

// This middleware is to add a virtual field called durationWeeks to the response
tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

// This middleware is to add a virtual field called reviews to the response
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour', // This is the name of the tour field in Review model
  localField: '_id', // This is the ID of the tour
});

// This is Document middleware that will be executed before the .save() event and the .create() event, not for update
tourSchema.pre('save', function (next) {
  // this keyword points to the current processed document
  this.slug = slugify(this.name, { lower: true });
  next();
});

// tourSchema.pre('save', async function (next) {
//   const guidesPromises = this.guides.map(async (id) => await User.findById(id));
//   this.guides = await Promise.all(guidesPromises);
//   next();
// });

// tourSchema.pre('save', function (next) {
//   console.log('Will save document...');
//   next();
// });

// This is Document middleware that will be executed after everything has been done
// tourSchema.post('save', function (doc, next) {
//   console.log(doc);
//   next();
// });

// QUERY MIDDLEWARE
// This middleware will run before the .find() event
tourSchema.pre(/^find/, function (next) {
  // the RegEx means any thing starts with "find"
  // tourSchema.pre('find', function (next) {
  // this keyword points to the current query
  this.find({ secretTour: { $ne: true } });
  this.start = Date.now();
  next();
});

tourSchema.pre(/^find/, function (next) {
  // this keyword points to the current query
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt',
  }); // This is to populate the field called guides inside each tour whenever we create a new tour by using referencing between a tour and guides.

  next();
});

tourSchema.post(/^find/, function (docs, next) {
  console.log(`Query took ${Date.now() - this.start} milliseconds`);
  next();
});

// AGGREGATION MIDDLEWARE will run after or before any aggregation
// tourSchema.pre('aggregate', function (next) {
//   // this keyword points to the current aggregation object
//   this.pipeline().unshift({
//     $match: { secretTour: { $ne: true } },
//   });
//   next();
// });

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
