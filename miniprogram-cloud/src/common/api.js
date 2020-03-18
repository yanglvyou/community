import UserService from "./user-service";
import TopicService from "./topic-service";
import PostService from "./post-service";
import MessageService from "./message-service";

export { weibo_emojis, baseUrl, eventHub, qiniuUrl, imgUrl, appUpdate } from "./base-service";
export const User = new UserService()
export const Topic = new TopicService()
export const Post = new PostService()
export const Message = new MessageService()