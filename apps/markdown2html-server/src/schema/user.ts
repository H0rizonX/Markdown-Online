// src/validator/user.ts
import Joi from 'joi';

// 创建用户时的验证规则
export const userCreateSchema = Joi.object({
  name: Joi.string().min(1).required().messages({
    'any.required': '用户名是必填项',
    'string.empty': '用户名不能为空',
  }),
  email: Joi.string().email().required().messages({
    'any.required': '邮箱是必填项',
    'string.email': '邮箱格式不正确',
  }),
});