import { Post, imgUrl } from '../common/api';
export default {
    data: {
        post: null,
    },
    onShareAppMessage() {
        if (this.post.posType === 1) {
            return {
                title: this.post.articleTitle,
                imageUrl: this.post.articleImg,
                path: `/pages/index?id=${Post.getUserId()}&postId=${this.post.id}`
            };
        } else {
            const imageUrl =
                this.post.imgs && this.post.imgs.length
                    ? this.post.imgs[0].path
                    : `${imgUrl}/share.png`;
            return {
                title: this.post.baseTxt || this.post.articleTitle || this.post.content,
                imageUrl: imageUrl,
                path: `/pages/index?id=${Post.getUserId()}&postId=${this.post.id}`
            };
        }
    },
    methods: {
        onShare(post) {
            this.post = post;
        }
    }
}