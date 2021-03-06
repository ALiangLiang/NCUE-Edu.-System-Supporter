(() => {
  let loc = document.location;
  if(loc.hostname === '120.107.178.150')
    document.location = `${loc.protocol}//webap.ncue.edu.tw${loc.pathname}`
})();

const
  loadingIcon = {
    start: () => document.getElementById('wait').style.display = '',
    stop: () => document.getElementById('wait').style.display = 'none'
  },
  padLeft = (str, lenght) => (str.toString().length >= lenght) ? str.toString() : padLeft('0' + str.toString(), lenght);

Vue.component('model', {
  props: ['id', 'title', 'requestCount', 'comments'],
  template: `
    <div class="modal fade" id="model" tabindex="-1" role="dialog" aria-labelledby="comment-head">
      <div class="modal-dialog" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
            <h4 class="modal-title" id="comment-head">{{title}}.</h4>
            <button
              v-on:click.stop="vm.request(id, $event)"
              id="requestBtn"
              type="button"
              class="btn btn-request"
              data-toggle="tooltip"
              data-placement="left"
              data-original-title="跪求評論">跪求評論<span id="requestCount" class="badge">{{requestCount}}</span></button>
            <button
              v-on:click.stop="$('#comment-form').collapse('toggle')"
              id="collapseBtn"
              class="btn btn-danger btn-fab"
              type="button"
              data-toggle="collapse"
              data-target="#comment-form"
              aria-expanded="false"
              aria-controls="comment-form"><i class="material-icons">add</i></button>
          </div>
          <div id="comment-body" class="modal-body">
            <div class="collapse" id="comment-form">
              <div class="well">
                <div class="form-group">
                  <label for="content">評論內容</label>
                  <textarea id="content" class="form-control" rows="5"></textarea>
                </div>
                <div class="checkbox">
                  <label>
                  <input id="anonymous" type="checkbox">
                    <span class="checkbox-material">
                      <span class="check"></span>
                    </span>匿名發表
                  </label>
                </div>
                <a id="comment" class="btn btn-info btn-fab">
                  <i class="material-icons">mode_edit</i>
                  <div class="ripple-container"></div>
                </a>
              </div>
            </div>
            <div id="comments">
              <card
                is="card"
                v-for="comment in comments"
                v-bind:id="comment.id"
                v-bind:title="comment.title"
                v-bind:content="comment.content"
                v-bind:thumb-count="comment.thumbCount">
              </card>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-default" data-dismiss="modal">關閉</button>
          </div>
        </div>
      </div>
    </div>`
});

Vue.component('card', {
  props: ['id', 'title', 'content', 'thumbCount'],
  template: `
    <div class="panel panel-info">
      <div class="panel-heading">
        <h3 class="panel-title">{{title}}</h3>
      </div>
      <div class="panel-body"><pre>{{content}}</pre></div>
      <div class="modal-footer">
        <button v-on:click.stop="vm.thumb(id, $event)" type="button" class="btn btn-info" data-toggle="tooltip" data-placement="left" data-original-title="認同請+1">
          <i class="material-icons">plus_one</i>
          <span class="badge">{{thumbCount}}</span>
        </button>
      </div>
    </div>`
});

/* 建立 google 登入鈕 */
Vue.component('signin', {
  props: ['isLogin'],
  template: `
    <a
      id="signin"
      v-on:click.stop="loginVm.login"
      v-bind:class="['btn', ((isLogin) ? 'btn-info' : 'btn-danger'), 'btn-raised']">
      <i class="material-icons">exit_to_app</i>
      {{((isLogin) ? '登出' : '登入') + ' Google'}}
    </a>`
});

/* 建立課程評價浮動視窗 */
const
  injection = document.createElement('div'),
  model = document.createElement('model');
model.setAttribute('v-bind:id', 'id');
model.setAttribute('v-bind:title', 'title');
model.setAttribute('v-bind:request-count', 'requestCount');
model.setAttribute('v-bind:comments', 'comments');
injection.id = 'injection';
injection.appendChild(model);
document.body.appendChild(injection);

/* 插入登入按鈕 */
const signin = document.createElement('signin');
signin.setAttribute('v-bind:is-login', 'isLogin');
document.body.querySelector('#mynav > div.container-fluid').appendChild(signin);

const loginVm = new Vue({
  el: '#mynav > div.container-fluid',
  data: {
    isLogin: false
  },
  created: function() {
    /* 初始化 google oauth2 套件 */
    gapi.auth2.init({
        client_id: '90791698805-qttq6in0t4q6bldl6ro39f3hp1i2fi9r.apps.googleusercontent.com',
        hosted_domain: 'gm.ncue.edu.tw'
      })
      .then((e) => {
        this.isLogin = gapi.auth2.getAuthInstance().currentUser.get().isSignedIn();
        $.snackbar({
          content: (this.isLogin) ? '已經登入 Google 帳戶。' : '尚未登入 Google 帳戶。'
        });
      });
    $('[data-toggle="tooltip"]').tooltip();
    console.log('登入實例初始化完畢');
  },
  methods: {
    login: function() {
      if (this.isLogin) {
        return gapi.auth2.getAuthInstance().signOut()
          .then(() => {
            $.snackbar({
              content: '成功登出。'
            });
            console.log('logout');
            return this.isLogin = false;
          });
      } else {
        return gapi.auth2.getAuthInstance().signIn()
          .then(() => {
            $.snackbar({
              content: '成功登入。'
            });
            console.log('login');
            return this.isLogin = true;
          });
      }
    }
  }
});

const vm = new Vue({
  el: '#injection',
  data: {
    id: null,
    title: '課程載入中',
    requestCount: 0,
    comments: []
  },
  created: function() {
    $('[data-toggle="tooltip"]').tooltip();
    console.log('Model 實例初始化完畢');
  },
  updated: function() {
    $('[data-toggle="tooltip"]').tooltip();
  },
  methods: {
    thumb: function(id, event) {
      const
        currentTarget = event.currentTarget,
        isActive = currentTarget.classList.contains('active'),
        url = (!isActive) ? '/thumb' : `/thumb/${id}`,
        method = (!isActive) ? 'POST' : 'DELETE',
        body = {
          commentId: (!isActive) ? id : void 0,
          token: gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().id_token,
        };
      new RequestAPI(url, method, body)
        .then(([json, ok, statusCode]) => {
          if (ok) {
            const num = currentTarget.querySelector('span.badge');
            num.innerText = (!isActive) ? Number(num.innerText) + 1 : Number(num.innerText) - 1;
            currentTarget.classList.toggle('active', !isActive);
            $.snackbar({
              content: (!isActive) ? '已認同' : '取消認同'
            });
          } else if (statusCode === 401) {
            $.snackbar({
              content: '尚未登入'
            });
            return loginVm.login();
          } else if (statusCode === 403)
            currentTarget.classList.toggle('active', true);
        });
    },
    request: function(id, event) {
      const
        currentTarget = event.currentTarget,
        isActive = currentTarget.classList.contains('active'),
        url = (!isActive) ? '/request' : `/request/${id}`,
        method = (!isActive) ? 'POST' : 'DELETE',
        body = {
          courseId: (!isActive) ? id : void 0,
          token: gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().id_token,
        };
      new RequestAPI(url, method, body)
        .then(([json, ok, statusCode]) => {
          if (ok) {
            const num = currentTarget.querySelector('span.badge');
            num.innerText = (!isActive) ? Number(num.innerText) + 1 : Number(num.innerText) - 1;
            currentTarget.classList.toggle('active', !isActive);
            $.snackbar({
              content: (!isActive) ? '請求評論成功' : '取消請求評論成功'
            });
          } else if (statusCode === 401) {
            $.snackbar({
              content: '尚未登入'
            });
            return loginVm.login();
          } else if (statusCode === 403)
            currentTarget.classList.toggle('active', true);
        });
    }
  }
});

const
  commentForm = document.querySelector('#content'),
  anonymousBtn = document.querySelector('#anonymous');

const
  commentBtn = document.getElementById('comment'),
  observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.type !== 'childList')
        return;
      const
        table = Array.from(mutation.addedNodes).find((e) => e.nodeName === 'TABLE'),
        newTd = document.createElement('td')
      newTd.classList = 'tbhead01';
      newTd.innerText = '評論';
      table.querySelector('thead > tr').appendChild(newTd);

      table.querySelectorAll('tbody > tr').forEach((tr) => {
        const
          courseClass = tr.children[2].innerText,
          courseName = tr.children[3].innerText,
          courseTeachers = tr.querySelector(':nth-child(11) > a > span').innerText.split('\n'),
          newTd = document.createElement('td'),
          btn = document.createElement('button');
        btn.type = 'button';
        btn.classList = 'btn btn-success btn-raised model-btn';
        btn.innerText = '查看評論';
        btn.setAttribute('data-class', courseClass);
        btn.setAttribute('data-course-name', courseName);
        btn.setAttribute('data-course-teachers', courseTeachers.toString());
        btn.setAttribute('data-header', `${courseClass} ${courseName}`);
        btn.onclick = function() {
          loadingIcon.start();
          const
            query = new URLSearchParams(),
            teachers = this.getAttribute('data-course-teachers').split(','),
            className = this.getAttribute('data-class'),
            courseName = this.getAttribute('data-course-name');
          teachers.forEach((teacher) => query.append('teachers', teacher));
          query.append('class', className);
          query.append('courseName', courseName);
          new RequestAPI(`/course?${query.toString()}`, 'GET')
            .then(([json]) => {
              loadingIcon.stop();
              vm.id = json.courseId;
              vm.className = className;
              vm.courseName = courseName;
              vm.courseTeachers = teachers;
              vm.title = this.getAttribute('data-header');
              vm.requestCount = json.requestCount;
              document.getElementById('requestCount').innerText = json.requestCount;
              vm.comments = json.comments.reverse().map((e) => {
                const
                  date = new Date(e.time),
                  timeString = `${date.getYear() + 1900}/${date.getMonth() + 1}/${date.getDate()} ${padLeft(date.getHours(),2)}:${padLeft(date.getMinutes(), 2)}`;
                return {
                  id: e.id,
                  title: `${e.author} ${timeString}`,
                  content: e.content,
                  thumbCount: e.thumbCount
                };
              });
              commentBtn.onclick = function() {
                if (commentForm.value.trim() === '')
                  return;
                loadingIcon.start();
                new RequestAPI('/comment', 'POST', {
                    courseClass: vm.className,
                    courseName: vm.courseName,
                    courseTeachers: vm.courseTeachers,
                    content: commentForm.value,
                    anonymous: anonymousBtn.checked,
                    token: gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().id_token,
                  })
                  .then(([json, ok, statusCode]) => {
                    loadingIcon.stop();
                    if (ok) {
                      const
                        date = new Date(json.time),
                        timeString = `${date.getYear() + 1900}/${date.getMonth() + 1}/${date.getDate()} ${padLeft(date.getHours(),2)}:${padLeft(date.getMinutes(), 2)}`,
                        newComment = {
                          id: json.id,
                          title: `${json.author} ${timeString}`,
                          content: json.content,
                          thumbCount: json.thumbCount
                        };
                      vm.comments.unshift(newComment);
                      commentForm.value = '';
                      $.snackbar({
                        content: '成功發表評論'
                      });
                      $('#comment-form').collapse('hide');
                    } else {
                      $.snackbar({
                        content: '發表評論失敗'
                      });
                      if (statusCode === 403)
                        loginVm.login()
                        .then((isLogin) => {
                          if (isLogin)
                            this.click();
                        });
                    }
                  });
              };
              $('#model').modal('show');
            });
        };
        newTd.appendChild(btn);
        tr.appendChild(newTd)
      });
    });
  }),
  target = document.getElementById('result'),
  config = {
    attributes: true,
    childList: true,
    characterData: true
  };
observer.observe(target, config);
