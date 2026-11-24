// Reproduction only. Acts like an SDK that instruments WKWebView:
// it adds one user script to each web view's WKUserContentController, once.
#import <UIKit/UIKit.h>
#import <WebKit/WebKit.h>

@interface ReproExternalUserScriptProbe : NSObject
@end

@implementation ReproExternalUserScriptProbe

static NSHashTable<WKUserContentController *> *instrumentedControllers;

+ (void)load {
  dispatch_async(dispatch_get_main_queue(), ^{
    instrumentedControllers = [NSHashTable weakObjectsHashTable];
    [NSTimer scheduledTimerWithTimeInterval:0.25 repeats:YES block:^(NSTimer *timer) {
      for (UIScene *scene in UIApplication.sharedApplication.connectedScenes) {
        if (![scene isKindOfClass:UIWindowScene.class]) {
          continue;
        }
        for (UIWindow *window in ((UIWindowScene *)scene).windows) {
          [self instrumentWebViewsIn:window];
        }
      }
    }];
  });
}

+ (void)instrumentWebViewsIn:(UIView *)view {
  if ([view isKindOfClass:WKWebView.class]) {
    WKUserContentController *controller = ((WKWebView *)view).configuration.userContentController;
    if (![instrumentedControllers containsObject:controller]) {
      [instrumentedControllers addObject:controller];
      [controller addUserScript:[[WKUserScript alloc] initWithSource:@"window.__externalSdkScript = true;"
                                                       injectionTime:WKUserScriptInjectionTimeAtDocumentStart
                                                    forMainFrameOnly:YES]];
      NSLog(@"[external-scripts] probe added a user script, total=%lu", (unsigned long)controller.userScripts.count);
    }
  }
  for (UIView *subview in view.subviews) {
    [self instrumentWebViewsIn:subview];
  }
}

@end
