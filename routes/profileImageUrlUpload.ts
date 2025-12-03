/*
 * Copyright (c) 2014-2023 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import fs = require('fs');
import { type Request, type Response, type NextFunction } from 'express';
import logger from '../lib/logger';

import { UserModel } from '../models/user';
import * as utils from '../lib/utils';
const security = require('../lib/insecurity');
const request = require('request');

module.exports = function profileImageUrlUpload() {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.body.imageUrl !== undefined) {
      // SECURITY FIX: Validate type (CWE-1287)
      const url = String(req.body.imageUrl || '');
      if (url.match(/(.)*solve\/challenges\/server-side(.)*/) !== null)
        req.app.locals.abused_ssrf_bug = true;
      const loggedInUser = security.authenticatedUsers.get(req.cookies.token);
      if (loggedInUser) {
        // SECURITY FIX: Validate and sanitize URL for SSRF prevention (CWE-918)
        const urlString = String(url || '');
        try {
          const parsedUrl = new URL(urlString);
          // Only allow http/https protocols
          if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
            res.status(400).json({ error: 'Invalid URL protocol' });
            return;
          }
          // Block internal/localhost URLs
          if (
            parsedUrl.hostname === 'localhost' ||
            parsedUrl.hostname === '127.0.0.1' ||
            parsedUrl.hostname.startsWith('192.168.') ||
            parsedUrl.hostname.startsWith('10.') ||
            parsedUrl.hostname.startsWith('172.')
          ) {
            res.status(400).json({ error: 'Internal URLs not allowed' });
            return;
          }
        } catch (e) {
          res.status(400).json({ error: 'Invalid URL format' });
          return;
        }

        const imageRequest = request
          .get(urlString)
          .on('error', function (err: unknown) {
            UserModel.findByPk(loggedInUser.data.id)
              .then(async (user: UserModel | null) => {
                return await user?.update({ profileImage: url });
              })
              .catch((error: Error) => {
                next(error);
              });
            logger.warn(
              `Error retrieving user profile image: ${utils.getErrorMessage(
                err
              )}; using image link directly`
            );
          })
          .on('response', function (res: Response) {
            if (res.statusCode === 200) {
              // SECURITY FIX: Sanitize user ID and file extension to prevent Path Traversal (CWE-23)
              const safeUserId = String(loggedInUser.data.id).replace(
                /[^a-zA-Z0-9_-]/g,
                ''
              );
              const urlParts = urlString.split('.');
              const rawExt =
                urlParts.length > 0
                  ? urlParts[urlParts.length - 1].toLowerCase()
                  : '';
              const ext = ['jpg', 'jpeg', 'png', 'svg', 'gif'].includes(rawExt)
                ? rawExt
                : 'jpg';
              imageRequest.pipe(
                fs.createWriteStream(
                  `frontend/dist/frontend/assets/public/images/uploads/${safeUserId}.${ext}`
                )
              );
              UserModel.findByPk(loggedInUser.data.id)
                .then(async (user: UserModel | null) => {
                  return await user?.update({
                    profileImage: `/assets/public/images/uploads/${loggedInUser.data.id}.${ext}`,
                  });
                })
                .catch((error: Error) => {
                  next(error);
                });
            } else
              UserModel.findByPk(loggedInUser.data.id)
                .then(async (user: UserModel | null) => {
                  return await user?.update({ profileImage: url });
                })
                .catch((error: Error) => {
                  next(error);
                });
          });
      } else {
        next(
          new Error('Blocked illegal activity by ' + req.socket.remoteAddress)
        );
      }
    }
    res.location(process.env.BASE_PATH + '/profile');
    res.redirect(process.env.BASE_PATH + '/profile');
  };
};
