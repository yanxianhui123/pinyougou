app.service("loginService",function ($http) {
    //读取登入人信息
    this.loginName=function () {
        return $http.get("../login/name.do")
    }
});