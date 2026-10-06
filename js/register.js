/* 登记报名：表单校验 + 照片上传 + 写入 Supabase（status = pending） */
(function () {
  'use strict';

  renderShell('register');

  var $ = function (id) { return document.getElementById(id); };

  function val(id) { var el = $(id); return el ? String(el.value || '').trim() : ''; }

  function genderValue() {
    var el = document.querySelector('input[name="gender"]:checked');
    return el ? el.value : '';
  }

  /* 生成会员编号：M/F + 年份后两位 + 4位随机数 */
  function makeCode(gender) {
    var y = String(new Date().getFullYear()).slice(-2);
    var n = String(Math.floor(1000 + Math.random() * 9000));
    return (gender === 'female' ? 'F' : 'M') + y + n;
  }

  /* 照片预览 */
  $('rx-photo').addEventListener('change', function (e) {
    var f = e.target.files && e.target.files[0];
    var img = $('rx-photo-preview');
    if (!f) { img.style.display = 'none'; return; }
    if (f.size > 5 * 1024 * 1024) {
      showToast('照片超过 5MB，请更换较小的图片', 'err');
      e.target.value = '';
      img.style.display = 'none';
      return;
    }
    var url = URL.createObjectURL(f);
    img.src = url;
    img.style.display = 'block';
  });

  /* 校验 */
  function validate() {
    var errors = [];
    if (!genderValue()) errors.push('请选择性别');
    if (!val('rx-name')) errors.push('请填写真实姓名');
    if (!val('rx-display')) errors.push('请填写公开称呼');
    var year = parseInt(val('rx-year'), 10);
    if (!year || year < 1950 || year > 2010) errors.push('请填写正确的出生年份（1950-2010）');
    var height = parseInt(val('rx-height'), 10);
    if (!height || height < 140 || height > 210) errors.push('请填写正确身高（140-210cm）');
    if (!val('rx-edu')) errors.push('请选择学历');
    if (!val('rx-job')) errors.push('请填写职业');
    if (!val('rx-marital')) errors.push('请选择婚姻状况');
    if (!val('rx-city')) errors.push('请填写现居城市');
    if (!/^1\d{10}$/.test(val('rx-phone'))) errors.push('手机号格式不正确（需 11 位）');
    if (val('rx-self').length < 30) errors.push('自我介绍不少于 30 字');
    if (val('rx-mate').length < 20) errors.push('择偶要求不少于 20 字');
    if (!$('rx-agree').checked) errors.push('请阅读并勾选信息真实性与展示授权');
    return errors;
  }

  /* 提交 */
  $('rx-submit').onclick = function () {
    var errors = validate();
    if (errors.length) {
      showModal('请完善以下信息',
        '<ul style="padding-left:20px;list-style:disc;line-height:2;font-size:.9375rem">' +
        errors.map(function (e) { return '<li>' + esc(e) + '</li>'; }).join('') + '</ul>', '');
      return;
    }

    var btn = $('rx-submit');
    btn.disabled = true;
    btn.textContent = '提交中…';

    var gender = genderValue();
    var code = makeCode(gender);
    var fileEl = $('rx-photo');
    var file = fileEl.files && fileEl.files[0];

    var upload = file ? Data.uploadPhoto(file) : Promise.resolve('');

    upload.catch(function (err) {
      // 照片上传失败不阻断提交，仅提示
      showToast('照片上传失败，本条将不带照片提交：' + (err.message || err), 'err');
      return '';
    }).then(function (photoUrl) {
      var payload = {
        code: code,
        gender: gender,
        name: val('rx-name'),
        display_name: val('rx-display'),
        birth_year: parseInt(val('rx-year'), 10),
        height: parseInt(val('rx-height'), 10),
        weight: val('rx-weight') ? parseInt(val('rx-weight'), 10) : null,
        education: val('rx-edu'),
        occupation: val('rx-job'),
        industry: '',
        income: val('rx-income'),
        city: val('rx-city'),
        district: val('rx-district'),
        hukou: val('rx-hukou'),
        marital_status: val('rx-marital'),
        has_children: val('rx-children'),
        housing: val('rx-housing'),
        car: val('rx-car'),
        phone: val('rx-phone'),
        wechat: val('rx-wechat'),
        self_intro: val('rx-self'),
        mate_expect: val('rx-mate'),
        photo_url: photoUrl || '',
        status: 'pending',
        source: 'web'
      };
      return Data.submitProfile(payload);
    }).then(function (row) {
      btn.disabled = false;
      btn.textContent = '提交登记资料';
      showModal('提交成功',
        '<div style="font-size:1rem;line-height:2">' +
        '<p>您的资料已提交，会员编号为 <strong style="color:#1b5aa8">' + esc((row && row.code) || code) + '</strong>。</p>' +
        '<p>工作人员将在 <strong>3 个工作日</strong>内完成资料审核，审核通过后将在“会员信息”栏目脱敏展示。</p>' +
        '<p>请保持电话畅通，如需补充材料我们会与您联系。</p>' +
        '<p style="color:#888;font-size:.875rem">咨询电话：' + esc(CFG.TEL) + '（' + esc(CFG.WORK_TIME) + '）</p>' +
        '</div>',
        '<a class="btn btn-sm" href="members.html?gender=' + gender + '">查看会员信息</a>');
      $('reg-form').reset();
      $('rx-photo-preview').style.display = 'none';
    }).catch(function (err) {
      btn.disabled = false;
      btn.textContent = '提交登记资料';
      var msg = (err && (err.message || err.error_description)) || String(err);
      var tip = msg;
      if (/relation .* does not exist/i.test(msg)) {
        tip = '数据表不存在：请先在 Supabase 的 SQL Editor 中执行 sql/schema.sql 建表。';
      } else if (/row-level security|permission denied/i.test(msg)) {
        tip = '写入被 RLS 策略拒绝：请确认 schema.sql 中的“匿名可提交登记”策略已执行。';
      } else if (/尚未配置/.test(msg)) {
        tip = msg;
      }
      showModal('提交失败', '<p style="font-size:.9375rem;line-height:1.9">' + esc(tip) + '</p>', '');
    });
  };
})();
