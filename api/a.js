const request = require("request");
const cheerio = require('cheerio');
const fs = require('fs')
const reg = /<script[\S\s]+?<\/script>/ig
request('https://zhuanlan.zhihu.com/p/106111605', function (error, response, body) {
  console.error('error:', error); // Print the error if one occurred
  console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
  //   console.log('body:', body.replace(reg, '')); // Print the HTML for the Google homepage.
  const $ = cheerio.load(body);
  console.log($('meta[property="twitter:title"]').attr('content'));
  console.log($('meta[property="twitter:image"]').attr('content'));
  console.log($('meta[property="twitter:description"]').attr('content'));
  // const imgs = $('img').toArray()
  // for (const img of imgs) {
  //   let src = $(img).attr('data-src')
  //   $(img).attr('src', `http://127.0.0.1:7001/img/${encodeURIComponent(src)}`)
  // }
  fs.writeFileSync('12.html', $.html())
});

{/* <script>
setTimeout(function () {
  var imgs = document.getElementsByClassName('rich_pages');
  for (const img of imgs) {
    img.setAttribute('src', img.getAttribute('data-src'))
  }
}, 1000)
</script> */}
console.log('http://mmbiz.qpic.cn/mmbiz_jpg/UnA0jic4OlicnicEra0PKWLKAzrcZWEeGNiaVW6BVBczgOPqCQ60o2XIJlrK0khibb8mqPuy7nxibRopmkcsF4UP048w/0?wx_fmt=jpeg'.length);
