import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:sociocon/core/notifiers/user.info.notifier.dart';
import 'package:sociocon/core/notifiers/user.notifier.dart';
import 'package:sociocon/core/notifiers/utility.notifier.dart';
import 'package:sociocon/core/services/cache_service.dart';

class CreateProfileScreen extends StatefulWidget {
  const CreateProfileScreen({
    Key? key,
  }) : super(key: key);

  @override
  _CreateProfileScreenState createState() => _CreateProfileScreenState();
}

class _CreateProfileScreenState extends State<CreateProfileScreen> {
  TextEditingController nameController = TextEditingController();
  TextEditingController bioController = TextEditingController();
  FocusNode nameFocusNode = FocusNode();
  FocusNode bioFocusNode = FocusNode();
  final _formKey = GlobalKey<FormState>();

  bool _isLoading = false;

  final CacheService _cacheService = new CacheService();

  String? _userImage = "";

  @override
  void initState() {
    Future.delayed(Duration.zero, () async {
      final userNotifier = Provider.of<UserNotifier>(context, listen: false);
      final token = await _cacheService.readCache(key: "jwtdata");
      if (token != null) {
        String jwt = token;
        await userNotifier.decodeUserData(
          context: context,
          token: jwt,
          option: 0,
        );
      }
    });
    super.initState();
  }

  @override
  void dispose() {
    nameController.dispose();
    bioController.dispose();
    nameFocusNode.dispose();
    bioFocusNode.dispose();
    super.dispose();
  }

  Future<void> saveForm() async {
    final isValid = _formKey.currentState!.validate();

    if (!isValid)
      return;
    else {
      setState(() {
        _isLoading = true;
      });
      _formKey.currentState!.save();
      createProfile();
    }
  }

  createProfile() async {
    var userNotifier = Provider.of<UserNotifier>(context, listen: false);
    var userInfoNotifier =
        Provider.of<UserInfoNotifier>(context, listen: false);
    final userInfoModel = userNotifier.userInfo;
    if (userInfoModel.userModel.userEmailId.isNotEmpty &&
        nameController.text.isNotEmpty &&
        bioController.text.isNotEmpty) {
      await userInfoNotifier.createProfile(
        context: context,
        name: nameController.text.trim(),
        userModel: userInfoModel.userModel,
        bio: bioController.text.trim(),
        dp: _userImage!,
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          backgroundColor: Colors.black87,
          content: Text(
            "Fill in the details",
          ),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final utilityNotifier =
        Provider.of<UtilityNotifier>(context, listen: false);
    _userImage = Provider.of<UtilityNotifier>(context, listen: true).userImage;
    var userNotifier = Provider.of<UserNotifier>(context, listen: false);
    return Scaffold(
      body: _isLoading == false
          ? Stack(
              children: [
                Form(
                  key: _formKey,
                  child: SingleChildScrollView(
                    physics: BouncingScrollPhysics(),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 20),
                      child: Column(
                        children: [
                          SizedBox(
                            height: 20 * 1,
                          ),
                          Text(
                            "TheSocioCon",
                          ),
                          SizedBox(
                            height: 20 * 2,
                          ),
                          Text(
                            "Profile",
                            textAlign: TextAlign.center,
                            style: Theme.of(context)
                                .textTheme
                                .headline5!
                                .copyWith(fontWeight: FontWeight.bold),
                          ),
                          SizedBox(
                            height: 20 * 1.5,
                          ),
                          Container(
                            child: Stack(
                              children: [
                                CircleAvatar(
                                  radius: 50,
                                  backgroundImage: _userImage!.isNotEmpty
                                      ? NetworkImage(_userImage!)
                                      : null,
                                  child: _userImage!.isNotEmpty
                                      ? null
                                      : Icon(Icons.person),
                                ),
                                Positioned(
                                  right: 0,
                                  bottom: 0,
                                  child: Container(
                                    height: 25,
                                    width: 25,
                                    decoration: BoxDecoration(
                                      shape: BoxShape.circle,
                                      border: Border.all(
                                        color: Theme.of(context)
                                            .scaffoldBackgroundColor,
                                        width: 3,
                                      ),
                                    ),
                                    child: IconButton(
                                      alignment: Alignment.center,
                                      padding: EdgeInsets.zero,
                                      iconSize: 20,
                                      icon: Icon(Icons.add),
                                      onPressed: () async {
                                        await utilityNotifier
                                            .uploadUserProfileImage(
                                          userName: userNotifier
                                              .userInfo.userModel.userName,
                                        );
                                      },
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          SizedBox(
                            height: 20 * 1,
                          ),
                          Container(
                            height: 50,
                            padding: EdgeInsets.symmetric(
                              horizontal: 20 * 0.75,
                            ),
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(40),
                            ),
                            child: TextFormField(
                              decoration: InputDecoration(
                                hintText: "Full Name",
                                border: InputBorder.none,
                                errorStyle: TextStyle(
                                  height: 0,
                                ),
                              ),
                              autovalidateMode:
                                  AutovalidateMode.onUserInteraction,
                              controller: nameController,
                              focusNode: nameFocusNode,
                              onEditingComplete: () => FocusScope.of(context)
                                  .requestFocus(bioFocusNode),
                              textCapitalization: TextCapitalization.words,
                              textInputAction: TextInputAction.next,
                              keyboardType: TextInputType.name,
                              validator: (value) {
                                if (value!.isEmpty) return 'Fill this field';
                                return null;
                              },
                            ),
                          ),
                          SizedBox(
                            height: 20 * 1,
                          ),
                          Container(
                            height: 50,
                            padding: EdgeInsets.symmetric(
                              horizontal: 20 * 0.75,
                            ),
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(40),
                            ),
                            child: TextFormField(
                              decoration: InputDecoration(
                                hintText: "Bio",
                                border: InputBorder.none,
                                errorStyle: TextStyle(
                                  height: 0,
                                ),
                              ),
                              minLines: 1,
                              maxLines: 2,
                              controller: bioController,
                              focusNode: bioFocusNode,
                              textCapitalization: TextCapitalization.words,
                              textInputAction: TextInputAction.newline,
                              keyboardType: TextInputType.multiline,
                            ),
                          ),
                          SizedBox(
                            height: 20 * 1,
                          ),
                          MaterialButton(
                            child: Text(
                              'Save Profile',
                            ),
                            onPressed: () async {
                              await saveForm();
                            },
                          ),
                          SizedBox(
                            height: 20 * 2,
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            )
          : Center(
              child: CircularProgressIndicator(),
            ),
    );
  }
}
