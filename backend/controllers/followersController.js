import {
  addToFollowing,
  getFollowingsList,
  removeFromFollowing,
} from '../services/followersServices.js';

export const getFollowingsListController = async (req, res) => {
  const userId = req.user.id;
  const followingsList = await getFollowingsList(userId);

  return res.status(200).json({
    message: 'Successfully retrieved user followings list',
    data: followingsList,
  });
};

export const addToFollowingController = async (req, res) => {
  const userId = req.user.id;
  const followUserId = req.params.id;

  if (userId === followUserId) {
    return res.status(400).json({ message: 'You cannot follow yourself' });
  }

  const newFollow = await addToFollowing(userId, followUserId);

  return res.status(201).json({
    message: 'Successfully followed the user',
    data: newFollow,
  });
};

export const removeFromFollowingController = async (req, res) => {
  const userId = req.user.id;
  const unfollowUserId = req.params.id;

  const removedFollow = await removeFromFollowing(userId, unfollowUserId);
  return res.status(200).json({
    message: 'Successfully unfollowed the user',
    data: removedFollow,
  });
};
