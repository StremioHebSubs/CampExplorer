import Review from '../models/reviewModel.js';
import Campground from '../models/campgroundModel.js';

const getAllCampgroundsPage = async (req, res) => {
  const campgrounds = await Campground.find({});
  res.render('campgrounds/index', { campgrounds });
};

const getNewCampgroundPage = async (req, res) => {
  res.render('campgrounds/new');
};

const getCampgroundPage = async (req, res) => {
  const campground = await Campground.findById(req.params.id)
    .populate('author')
    .populate({ path: 'reviews', populate: { path: 'author' } });

  res.render('campgrounds/show', { campground });
};

const getEditCampgroundPage = async (req, res) => {
  const campground = await Campground.findById(req.params.id);

  res.render('campgrounds/edit', { campground });
};

const postCampground = async (req, res) => {
  const campground = await new Campground({
    ...req.body.campground,
    author: req.session.user_id,
    images: req.files.map((file) => ({
      url: file.path,
      filename: file.filename,
    })),
  }).save();

  req.flash('msg', {
    type: 'success',
    message: 'Successfully made a new campground!',
  });

  res.redirect(`/campgrounds/${campground._id}`);
};

const postUpdatedCampground = async (req, res) => {
  const campground = await Campground.findByIdAndUpdate(req.params.id, {
    ...req.body.campground,
  });

  if (
    req.files.length + campground.images.length + req.body.deleteImages.length >
    5
  ) {
    req.flash('msg', {
      type: 'info',
      message: 'Post contain max of 5 images',
    });

    return res.redirect(`/campgrounds/${campground._id}`);
  }

  const images = req.files.map((file) => ({
    url: file.path,
    filename: file.filename,
  }));

  campground.images.push(...images);
  await campground.save();

  if (req.body.deleteImages) {
    for (let filename of req.body.deleteImages) {
      await cloudinary.uploader.destroy(filename);
    }

    await campground.updateOne({
      $pull: { images: { filename: { $in: req.body.deleteImages } } },
    });
  }

  req.flash('msg', {
    type: 'success',
    message: 'Successfully updated a campground!',
  });

  res.redirect(`/campgrounds/${campground._id}`);
};

const deleteCampground = async (req, res) => {
  const campground = await Campground.findById(req.params.id);

  await Review.deleteMany({ _id: { $in: campground.reviews } });

  for (let image of campground.images) {
    await cloudinary.uploader.destroy(image.filename);
  }

  await Campground.findByIdAndDelete(req.params.id);

  req.flash('msg', {
    type: 'success',
    message: 'Successfully deleted a campground!',
  });
  res.redirect('/campgrounds');
};

export {
  getAllCampgroundsPage,
  getNewCampgroundPage,
  getCampgroundPage,
  getEditCampgroundPage,
  postCampground,
  postUpdatedCampground,
  deleteCampground,
};
