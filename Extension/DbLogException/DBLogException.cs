using System;
using System.Collections.Generic;
using System.Text;
using System.Data;
using Aspectize.Core;
using System.IO;

namespace DBLogException
{
    [Service(Name = "DBLogException", ConfigurationRequired = true)]
    public class DBLogException : ILog //, IInitializable, ISingleton
    {
        [Parameter(Optional = false)]
        string DataServiceName = "";

        [Parameter(Optional = true)]
        string FileServiceName = "";

        [Parameter(Optional = true)]
        string MailServiceName = "";

        [Parameter(Optional = true)]
        string MailTo = "";

        void ILog.WriteLog(TraceInfo traceInfo)
        {
            if (traceInfo.Level < 0)
            {
                IDataManager dm = EntityManager.FromDataBaseService(DataServiceName);

                IEntityManager em = dm as IEntityManager;

                if (!ExecutingContext.CurrentHostUrl.ToLower().StartsWith(@"http://localhost"))
                {
                    bool messageTooLong = traceInfo.Message.Length > 32000;

                    LogException logException = em.CreateInstance<LogException>();

                    logException.ApplicationName = traceInfo.ApplicationName;
                    logException.CommandName = traceInfo.CommandName;
                    logException.InfoTypeName = traceInfo.InfoTypeName;
                    logException.Message = (messageTooLong) ? "" : traceInfo.Message;
                    logException.ServiceName = traceInfo.ServiceName;
                    logException.DateException = traceInfo.Received;
                    logException.UserAgent = (System.Web.HttpContext.Current != null && System.Web.HttpContext.Current.Request != null) ? System.Web.HttpContext.Current.Request.UserAgent : "";

                    AspectizeUser aspectizeUser = ExecutingContext.CurrentUser;

                    if (aspectizeUser.IsAuthenticated && aspectizeUser["Email"] != null)
                    {
                        logException.UserName = aspectizeUser["Email"].ToString();
                    }
                    else
                    {
                        logException.UserName = "Unknow user";
                    }

                    if (messageTooLong && !string.IsNullOrEmpty(FileServiceName))
                    {
                        IFileService fs = ExecutingContext.GetService<IFileService>(FileServiceName);

                        Guid fileId = Guid.NewGuid();

                        string fileName = string.Format("Trace/{0}.txt", fileId);

                        logException.Message = string.Format("Message Exception is too long to be saved in entity, and is saved in file {0}", fileName);

                        MemoryStream stream = new MemoryStream();
                        StreamWriter writer = new StreamWriter(stream);
                        writer.Write(traceInfo.Message);
                        writer.Flush();
                        stream.Position = 0;

                        fs.Write(fileName, stream);
                    }

                    dm.SaveTransactional();

                    if (!string.IsNullOrEmpty(MailTo) && !string.IsNullOrEmpty(MailServiceName))
                    {
                        IAspectizeSMTPService smtpService = ExecutingContext.GetService<IAspectizeSMTPService>(MailServiceName);

                        string subject = string.Format("Bug : {0} {1}", traceInfo.ApplicationName, logException.UserName);

                        StringBuilder sb = new StringBuilder();

                        sb.AppendLine();
                        sb.AppendFormat("Date: {0}", traceInfo.Received);
                        sb.AppendLine("<br />");
                        sb.AppendLine();
                        sb.AppendFormat("Application: {0}", traceInfo.ApplicationName);
                        sb.AppendLine("<br />");
                        sb.AppendLine();
                        sb.AppendFormat("Host: {0}", ExecutingContext.CurrentHostUrl);
                        sb.AppendLine("<br />");
                        sb.AppendLine();
                        if (System.Web.HttpContext.Current != null && System.Web.HttpContext.Current.Request != null)
                        {
                            sb.AppendFormat("Url: {0}", System.Web.HttpContext.Current.Request.Url.AbsoluteUri);
                            sb.AppendLine("<br />");
                            sb.AppendLine();
                        }
                        sb.AppendFormat("UserAgent: {0}", logException.UserAgent);
                        sb.AppendLine("<br />");
                        sb.AppendLine();
                        sb.AppendFormat("Service: {0}", traceInfo.ServiceName);
                        sb.AppendLine("<br />");
                        sb.AppendLine();
                        sb.AppendFormat("Command: {0}", traceInfo.CommandName);
                        sb.AppendLine("<br />");
                        sb.AppendLine();
                        sb.AppendFormat("Message: {0}", traceInfo.Message.Replace("\r\n", "<br />"));
                        sb.AppendLine("<br />");

                        string emailContent = sb.ToString();

                        smtpService.SendMail(false, MailTo.Split(','), subject, emailContent, null);
                    }
                }
            }
        }
    }
}
