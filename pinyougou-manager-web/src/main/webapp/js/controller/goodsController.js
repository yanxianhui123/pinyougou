 //控制层
app.controller('goodsController' ,function($scope,$controller,$location ,goodsService,itemCatService,typeTemplateService){

	$controller('baseController',{$scope:$scope});//继承

    //读取列表数据绑定到表单中
	$scope.findAll=function(){
		goodsService.findAll().success(
			function(response){
				$scope.list=response;
			}
		);
	}

	//分页
	$scope.findPage=function(page,rows){
		goodsService.findPage(page,rows).success(
			function(response){
				$scope.list=response.rows;
				$scope.paginationConf.totalItems=response.total;//更新总记录数
			}
		);
	}

	 //查询实体
    $scope.findOne = function () {
        var id= $location.search()['id'];//获取参数值

        if (id == null) {return}
        goodsService.findOne(id).success(
            function(response){
                $scope.entity= response;
                //向富文本编辑器添加商品介绍
                editor.html($scope.entity.goodsDesc.introduction);
                //显示图片列表
                $scope.entity.goodsDesc.itemImages= JSON.parse($scope.entity.goodsDesc.itemImages);
                $scope.entity.goodsDesc.customAttributeItems= JSON.parse($scope.entity.goodsDesc.customAttributeItems);
                $scope.entity.goodsDesc.specificationItems=JSON.parse($scope.entity.goodsDesc.specificationItems);
                //SUK列表规格列转化
                for(var i=0;i< $scope.entity.itemList.length;i++ ){
                    $scope.entity.itemList[i].spec=  JSON.parse($scope.entity.itemList[i].spec);
                }
            }

        );
    }

	//保存
	$scope.save=function(){
		var serviceObject;//服务层对象
		if($scope.entity.id!=null){//如果有ID
			serviceObject=goodsService.update( $scope.entity ); //修改
		}else{
			serviceObject=goodsService.add( $scope.entity  );//增加
		}
		serviceObject.success(
			function(response){
				if(response.success){
					//重新查询
		        	$scope.reloadList();//重新加载
				}else{
					alert(response.message);
				}
			}
		);
	}


	//批量删除
	$scope.dele=function(){
		//获取选中的复选框
		goodsService.dele( $scope.selectIds ).success(
			function(response){
				if(response.success){
					$scope.reloadList();//刷新列表
					$scope.selectIds=[];
				}
			}
		);
	}

	$scope.searchEntity={};//定义搜索对象

	//搜索
	$scope.search=function(page,rows){
		goodsService.search(page,rows,$scope.searchEntity).success(
			function(response){
				$scope.list=response.rows;
				$scope.paginationConf.totalItems=response.total;//更新总记录数
			}
		);
	}
    $scope.status=['未审核','已审核','审核未通过','关闭'];//商品状态
    $scope.itemCatList=[];//商品分类列表
       //查询商品分类
    $scope.findItemCatList=function(){
        itemCatService.findAll().success(
            function(response){
                for(var i=0;i<response.length;i++){
                    $scope.itemCatList[response[i].id ]=response[i].name;
                }
            }
        );
    }
    //更改状态
    $scope.updateStatus=function(status){
        goodsService.updateStatus($scope.selectIds,status).success(
            function(response){
                if(response.success){//成功
                    $scope.reloadList();//刷新列表
                    $scope.selectIds=[];//清空 ID 集合
                }else{
                    alert(response.message);
                }
            }
        );
    };
    //读取一级目录
    $scope.selectItemCat1List = function () {
        itemCatService.findByParentId(0).success(
            function (response) {

                $scope.itemCat1List = response;


            }
        );
    }
    //读取二级目录
    $scope.$watch('entity.goods.category1Id', function (newValue, oldValue) {
        if (newValue==oldValue)
            return;
        //根据选择的值，查询二级目录
        itemCatService.findByParentId(newValue).success(
            function (response) {
                $scope.itemCat2List = response;
                // $scope.itemCat3List={};
                // $scope.entity.goods.typeTemplateId='';

            }
        );
    });
    //读取三级目录
    $scope.$watch('entity.goods.category2Id', function (newValue, oldValue) {
        if (newValue==oldValue)
            return;
        itemCatService.findByParentId(newValue).success(
            function (respomse) {
                $scope.itemCat3List = respomse;
            }
        );
    });
    //更新模板
    $scope.$watch('entity.goods.category3Id',function (newValue, oldValue) {
        if (newValue==oldValue)
            return;
        itemCatService.findOne(newValue).success(
            function (response) {
                $scope.entity.goods.typeTemplateId=response.typeId;
            }
        );
    });
    //模板ID选择后，更新品牌
    $scope.$watch('entity.goods.typeTemplateId',function (newValue, oldValue) {
        if (newValue==oldValue)
            return;
        typeTemplateService.findOne(newValue).success(
            function (respense) {
                console.log(newValue)
                //获取类型模板
                $scope.typeTemplate=respense;
                //品牌列表
                $scope.typeTemplate.brandIds= JSON.parse($scope.typeTemplate.brandIds);
                //扩展属性

                if ($location.search()['id'] == null) {$scope.entity.goodsDesc.customAttributeItems= JSON.parse($scope.typeTemplate.customAttributeItems);
                }
            }
        );
        //查询规格列表
        typeTemplateService.findSpecList(newValue).success(

            function (response) {
                console.log(response)
                $scope.specList=response;
            }
        );
    });
    //保存选中规格
    $scope.updateSpecAttribute=function($event,name,value){
        var object= $scope.searchObjectByKey(
            $scope.entity.goodsDesc.specificationItems ,'attributeName', name);
        if(object!=null){
            if($event.target.checked ){
                object.attributeValue.push(value);
            }else{//取消勾选
                object.attributeValue.splice( object.attributeValue.indexOf(value ) ,1);//移除选项
                //选项都取消了，将此条记录移除
                if(object.attributeValue.length==0){
                    $scope.entity.goodsDesc.specificationItems.splice(
                        $scope.entity.goodsDesc.specificationItems.indexOf(object),1);
                }
            }
        }else{
            $scope.entity.goodsDesc.specificationItems.push(
                {"attributeName":name,"attributeValue":[value]});
        }
    }
    //创建SKU列表
    $scope.createItemList=function () {
        $scope.entity.itemList=[{spec:{},price:0,num:99999,status:'0',isDefault:'0'}];//初始
        var items = $scope.entity.goodsDesc.specificationItems;
        for (var i = 0; i < items.length; i++) {
            $scope.entity.itemList= addColumn( $scope.entity.itemList, items[i].attributeName,items[i].attributeValue );
        }
    };

//添加列值
    addColumn=function (list,columnName,columnValues) {
        //新的集合
        var newList=[];
        for (var i = 0; i < list.length; i++) {
            var oldRow = list[i];
            for (var j = 0; j < columnValues.length; j++) {
                //深克隆
                var newRow = JSON.parse(JSON.stringify(oldRow));
                newRow.spec[columnName] = columnValues[j];
                newList.push(newRow);
            }
        }
        return newList;
    };
    //根据规格名称和选项名称返回是否被勾选
    $scope.checkAttributeValue=function(specName,optionName){
        var items= $scope.entity.goodsDesc.specificationItems;
        var object= $scope.searchObjectByKey(items,'attributeName',specName);
        if(object==null){
            return false;
        }else{
            if(object.attributeValue.indexOf(optionName)>=0){
                return true;
            }else{
                return false;
            }
        }
    }

});
