package no.unieconomy.unieconomymobile;

import android.app.Application;

import com.facebook.react.ReactApplication;
import com.reactnativecommunity.asyncstorage.AsyncStoragePackage;
import com.csath.RNConfigReaderPackage;
import com.rnappauth.RNAppAuthPackage;
import com.swmansion.gesturehandler.react.RNGestureHandlerPackage;
import com.oblador.vectoricons.VectorIconsPackage;
import com.microsoft.appcenter.reactnative.crashes.AppCenterReactNativeCrashesPackage;
import com.microsoft.appcenter.reactnative.analytics.AppCenterReactNativeAnalyticsPackage;
import com.microsoft.appcenter.reactnative.appcenter.AppCenterReactNativePackage;
import com.geektime.rnonesignalandroid.ReactNativeOneSignalPackage;
import com.microsoft.codepush.react.CodePush;
import org.reactnative.camera.RNCameraPackage;
import com.reactnative.ivpusic.imagepicker.PickerPackage;
import com.oblador.keychain.KeychainPackage;
import com.apsl.versionnumber.RNVersionNumberPackage;
import com.reactnative.photoview.PhotoViewPackage;
import com.horcrux.svg.SvgPackage;
import com.sadcoat.logentries.LogentriesReactPackage;
import me.jhen.react.BadgePackage;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.shell.MainReactPackage;
import com.facebook.soloader.SoLoader;

import java.util.Arrays;
import java.util.List;

public class MainApplication extends Application implements ReactApplication {

  private final ReactNativeHost mReactNativeHost = new ReactNativeHost(this) {

        @Override
        protected String getJSBundleFile() {
        return CodePush.getJSBundleFile();
        }
    
    @Override
    public boolean getUseDeveloperSupport() {
      return BuildConfig.DEBUG;
    }

    @Override
    protected List<ReactPackage> getPackages() {
      return Arrays.<ReactPackage>asList(
          new MainReactPackage(),
            new AsyncStoragePackage(),
            new RNConfigReaderPackage(BuildConfig.class),
            new RNAppAuthPackage(),
            new RNGestureHandlerPackage(),
            new VectorIconsPackage(),
            new AppCenterReactNativeCrashesPackage(MainApplication.this, getResources().getString(R.string.appCenterCrashes_whenToSendCrashes)),
            new AppCenterReactNativeAnalyticsPackage(MainApplication.this, getResources().getString(R.string.appCenterAnalytics_whenToEnableAnalytics)),
            new AppCenterReactNativePackage(MainApplication.this),
            new ReactNativeOneSignalPackage(),
            new CodePush(BuildConfig.CODEPUSH_KEY, getApplicationContext(), BuildConfig.DEBUG),
            new RNCameraPackage(),
            new PickerPackage(),
            new KeychainPackage(),
            new RNVersionNumberPackage(),
            new PhotoViewPackage(),
            new SvgPackage(),
            new LogentriesReactPackage(),
            new BadgePackage()
      );
    }

    @Override
    protected String getJSMainModuleName() {
      return "index";
    }
  };

  @Override
  public ReactNativeHost getReactNativeHost() {
    return mReactNativeHost;
  }

  @Override
  public void onCreate() {
    super.onCreate();
    SoLoader.init(this, /* native exopackage */ false);
  }
}
